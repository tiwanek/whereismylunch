__author__ = 'Tomasz Iwanek'

import functools

from flask import Blueprint, abort, request, current_app
from flask_restful import Resource, Api, reqparse
from playhouse.shortcuts import model_to_dict
from peewee import IntegrityError
from whereismylunch.db import db
from whereismylunch.session import authenticate
from whereismylunch.mail import get_mail_sender, MailDeliverException

from whereismylunch.db import User, Lunch, Restaurant, Order, Balance


# TODO(t.iwanek): don't use integers...
def is_lunch_transition_allowed(old_status, new_status):
    transitions = {(0, 1), (0, 3), (1, 2), (1, 3)}
    return (old_status, new_status) in transitions


def status_id_to_string(status):
    strings = {
        0: "Created",
        1: "Ordered",
        2: "Arrived",
        3: "Cancelled"
    }
    return strings[status]



def add_balance(giver, taker, value):
    balance_try_1 = Balance.select().where(Balance.first_user == taker
                                                       and Balance.second_user == giver)
    if balance_try_1:
        b = balance_try_1[0]
        b.value += value
        b.save()
        return

    balance_try_2 = Balance.select().where(Balance.first_user == giver
                                           and Balance.second_user == taker)

    if balance_try_2:
        b = balance_try_2[0]
        b.value -= value
        b.save()
        return

    b = Balance(first_user=taker, second_user=giver, value=value)
    b.save()
    return


class SafeResource(Resource):
    def exclude_fields(self):
        return [User.password, User.token, User.reset_token, User.reset_date]

class GenericResource(SafeResource):
    def get_args(self, is_insert):
        raise NotImplemented()

    def may_post(self, row, args):
        return True

    def may_put(self, row, args):
        return True

    def may_delete(self, row):
        return False

    def after_post(self, row):
        return True

    def after_put(self, row):
        return True

    def add_order_by(self, query):
        return query

    def get(self, id=None, subresource=None):
        model = getattr(self, 'model')
        try:
            if id is not None:
                if subresource:
                    record = model.get(id=id)
                    if not hasattr(record, subresource):
                        abort(400)
                    return list(map(functools.partial(model_to_dict, exclude=self.exclude_fields()),
                                    getattr(record, subresource)))
                else:
                    return model_to_dict(model.get(id=id), exclude=self.exclude_fields())
            else:
                obj_list = self.add_order_by(model.select())
                return list(map(functools.partial(model_to_dict, exclude=self.exclude_fields()),
                                obj_list.execute()))
        except model.DoesNotExist:
            abort(404)

    @authenticate
    def put(self, id=None, subresource=None):
        model = getattr(self, 'model')
        if subresource:
            abort(400)
        if not id:
            abort(400)
        args = self.get_args(False)
        try:
            with db.atomic():
                r = model.get(id=id)
                if not self.may_put(r, args):
                    abort(403)
                for k, v in args.items():
                    if v:
                        setattr(r, k, v)
                r.save()
                if not self.after_put(r):
                    abort(400)
        except model.DoesNotExist:
            abort(404)
        except IntegrityError:
            abort(400)

    @authenticate
    def post(self, id=None, subresource=None):
        model = getattr(self, 'model')
        if subresource:
            abort(400)
        if id:
            abort(400)
        with db.atomic():
            args = self.get_args(True)
            try:
                r = model()
                for k, v in args.items():
                    if v:
                        setattr(r, k, v)
                if not self.may_post(r, args):
                    abort(403)
                r.save()
                if not self.after_post(r):
                    abort(400)
            except IntegrityError:
                abort(400)

    @authenticate
    def delete(self, id=None, subresource=None):
        model = getattr(self, 'model')
        if subresource:
            abort(400)
        if not id:
            abort(400)
        try:
            with db.atomic():
                r = model.get(id=id)
                if not self.may_delete(r):
                    abort(403)
                r.delete_instance()
        except model.DoesNotExist:
            abort(404)
        except IntegrityError:
            abort(400)


class RestaurantResource(GenericResource):
    model = Restaurant

    def get_args(self, is_insert):
        parser = reqparse.RequestParser()
        parser.add_argument('name', required=is_insert, help="Cannot parse 'name'")
        parser.add_argument('site', required=is_insert, help="Cannot parse 'site'")
        return parser.parse_args()


class LunchResource(GenericResource):
    model = Lunch

    def get_args(self, is_insert):
        parser = reqparse.RequestParser()
        if is_insert:
            parser.add_argument('creator', type=int, required=True, help="Cannot parse 'creator'")
            parser.add_argument('restaurant', type=int, required=True, help="Cannot parse 'restaurant'")
        parser.add_argument('order_date', type=str, required=is_insert, help="Cannot parse 'order_date'")
        parser.add_argument('delivery_date', type=str, required=is_insert, help="Cannot parse 'delivery_date'")
        parser.add_argument('status', type=int, required=False, help="Cannot parse 'status'")
        return parser.parse_args()

    def may_put(self, row, args):
        if request.user_id != row.creator.id:
            return False

        return is_lunch_transition_allowed(row.status, args.status)

    def after_put(self, row):
        if row.status == 2:
            #if state is two there must have been a transition to ARRIVED
            for order in row.orders:
                if request.user_id != order.user.id:
                    add_balance(order.user.id, request.user_id, order.price)

        #send email to participants
        for order in row.orders:
            try:
                get_mail_sender().send_lunch_notification(order.user.email, row.id, row.restaurant.name,
                                                          status_id_to_string(row.status))
            except MailDeliverException:
                current_app.logger.error("Failed to send email to %s" % order.user.email)


        return True

    def add_order_by(self, query):
        return query.order_by(Lunch.delivery_date.desc())


class OrderResource(GenericResource):
    model = Order

    def get_args(self, is_insert):
        parser = reqparse.RequestParser()
        if is_insert:
            parser.add_argument('user', type=int, required=True, help="Cannot parse 'user'")
            parser.add_argument('lunch', type=int, required=True, help="Cannot parse 'lunch'")
        parser.add_argument('menu', required=is_insert, help="Cannot parse 'menu'")
        parser.add_argument('price', type=int, required=is_insert, help="Cannot parse 'price'")
        return parser.parse_args()

    def may_put(self, row, args):
        return request.user_id == row.user.id

    def may_delete(self, row):
        return row.lunch.status == 0 and request.user_id == row.user.id


class UserResource(GenericResource):
    model = User

    def get_args(self, is_insert):
        return {}

    def may_put(self, row, args):
        return False

    def may_post(self, row, args):
        return False


class BalanceResource(SafeResource):
    @authenticate
    def get(self, id=None):
        if not id:
            abort(400)
        if id != request.user_id:
            abort(403)
        return list(map(functools.partial(model_to_dict, exclude=self.exclude_fields()),
                        Balance.select().where(Balance.first_user == id or Balance.second_user == id)))

    @authenticate
    def post(self, id=None):
        if id:
            abort(404)
        parser = reqparse.RequestParser()
        parser.add_argument('taker', type=int, required=True, help="Cannot parse 'taker'")
        parser.add_argument('giver', type=int, required=True, help="Cannot parse 'giver'")
        parser.add_argument('value', type=int, required=True, help="Cannot parse 'value'")
        args = parser.parse_args()

        if args.value < 0:
            abort(400)
        if args.giver == args.taker:
            abort(400)
        # user cannot add for himself
        if args.giver != request.user_id:
            abort(403)

        try:
            with db.atomic():
                add_balance(args.giver, args.taker, args.value)
                return "", 200

        except IntegrityError:
            abort(400)


bapi = Blueprint('api', __name__)
api = Api(bapi)
api.add_resource(RestaurantResource, '/restaurant/', '/restaurant/<int:id>')
api.add_resource(OrderResource, '/order/', '/order/<int:id>')
api.add_resource(LunchResource, '/lunch/', '/lunch/<int:id>', '/lunch/<int:id>/<subresource>/')
api.add_resource(UserResource, '/user/')
api.add_resource(BalanceResource, '/balance/', '/balance/<int:id>')
