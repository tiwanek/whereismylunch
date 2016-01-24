__author__ = 'Tomasz Iwanek'

import functools
import json
import datetime

from flask import Blueprint, request, abort
from flask_restful import reqparse
from whereismylunch.utils import encode_password, create_session_token
from whereismylunch.db import User, db
from whereismylunch.mail import get_mail_sender


HTTP_HEADER_AUTHORIZATION_USER = 'X-Authorization-User'
HTTP_HEADER_AUTHORIZATION_PASSWORD = 'X-Authorization-Password'
HTTP_HEADER_AUTHORIZATION_TOKEN = 'X-Authorization-Token'


def authenticate(func):
    """
    Decorator for user authentication.
    Expects 'X-Authorization-Token' header
    Authentication if:
     - successful - leaves user_id in request context
     - failed     - return HTTP 401

    :param func: wrapped function
    :return: function wrapper
    """
    @functools.wraps(func)
    def helper(*args, **kwargs):
        if HTTP_HEADER_AUTHORIZATION_TOKEN not in request.headers:
            abort(401)
        token = request.headers[HTTP_HEADER_AUTHORIZATION_TOKEN] # TODO(t.iwanek): cache token?
        try:
            with db.atomic():
                user = User.select().where(User.token == token).get()
                request.user_id = user.id
                return func(*args, **kwargs)
        except User.DoesNotExist:
            abort(401)

    return helper


bsession = Blueprint('session', __name__)


@bsession.route('/user/login', methods=['POST'])
def login():
    if HTTP_HEADER_AUTHORIZATION_USER not in request.headers:
        abort(400)
    if HTTP_HEADER_AUTHORIZATION_PASSWORD not in request.headers:
        abort(400)
    name = request.headers[HTTP_HEADER_AUTHORIZATION_USER]
    password = encode_password(request.headers[HTTP_HEADER_AUTHORIZATION_PASSWORD])
    try:
        with db.atomic():
            user = User.select().where(User.name == name).get()
            if user.password == password:
                token = create_session_token()
                user.token = token
                user.save()
                response = {"id": user.id, "name": user.name, "token": user.token, "email": user.email}
                return json.dumps(response)
            else:
                abort(403)
    except User.DoesNotExist:
        abort(400)


@bsession.route('/user/logout', methods=['POST'])
@authenticate
def logout():
    try:
        with db.atomic():
            user = User.select().where(User.id == request.user_id).get()
            user.token = None
            user.save()
            return "", 200
    except User.DoesNotExist:
        abort(400)


@bsession.route('/user/password', methods=['POST'])
@authenticate
def change_password():
    parser = reqparse.RequestParser()
    parser.add_argument('password', required=True, help="Cannot parse 'password'")
    args = parser.parse_args()
    try:
        with db.atomic():
            user = User.select().where(User.id == request.user_id).get()
            user.password = encode_password(args.password)
            user.save()
            return "", 200
    except User.DoesNotExist:
        abort(400)


@bsession.route('/user/register', methods=['POST'])
def register():
    parser = reqparse.RequestParser()
    parser.add_argument('name', required=True, help="Cannot parse 'name'")
    parser.add_argument('password', required=True, help="Cannot parse 'password'")
    parser.add_argument('email', required=True, help="Cannot parse 'email'")
    args = parser.parse_args()
    users_with_name = User.select().where(User.name == args.name)
    if users_with_name:
        abort(409)
    with db.atomic():
        user = User(name=args.name, password=encode_password(args.password), email = args.email)
        user.save()
        return "", 200


@bsession.route('/user/<int:id>', methods=['PUT'])
@authenticate
def user_edit(id):
    if id != request.user_id:
        abort(403)
    parser = reqparse.RequestParser()
    parser.add_argument('old_password', required=True, help="Cannot parse 'old_password'")
    parser.add_argument('password', required=True, help="Cannot parse 'password'")
    parser.add_argument('email', required=True, help="Cannot parse 'email'")
    args = parser.parse_args()
    try:
        with db.atomic():
            user = User.select().where(User.id == id).get()
            old_password = encode_password(args.old_password)
            new_password = encode_password(args.password)
            if user.password != old_password:
                abort(403)
            user.password = new_password
            user.email = args.email
            user.save()
            return "", 200
    except User.DoesNotExist:
        abort(400)


@bsession.route('/user/reset_password', methods=['POST'])
def reset_password():
    parser = reqparse.RequestParser()
    parser.add_argument('email', required=True, help="Cannot parse 'email'")
    parser.add_argument('base_url', required=True, help="Cannot parse 'base_url'")
    args = parser.parse_args()
    reset_token = create_session_token()
    try:
        with db.atomic():
            user = User.select().where(User.email == args.email).get()
            user.reset_date = datetime.datetime.now()
            user.reset_token = reset_token
            user.save()
    except User.DoesNotExist:
        abort(404)

    get_mail_sender().send_reset_token_email(args.email, reset_token, args.base_url)

    return "", 200


@bsession.route('/user/send_new_password', methods=['POST'])
def new_password():
    parser = reqparse.RequestParser()
    parser.add_argument('password', required=True, help="Cannot parse 'email'")
    parser.add_argument('token', required=True, help="Cannot parse 'base_url'")
    args = parser.parse_args()
    try:
        with db.atomic():
            done = False
            user = User.select().where(User.reset_token == args.token).get()
            if user.reset_date + datetime.timedelta(days=1) > datetime.datetime.now():
                user.password = encode_password(args.password)
                done = True
            user.reset_date = None
            user.reset_token = None
            user.save()
            if not done:
                abort(404)
            return "", 200
    except User.DoesNotExist:
        abort(404)
