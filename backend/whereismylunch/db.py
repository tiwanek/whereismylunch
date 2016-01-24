__author__ = 'Tomasz Iwanek'

from peewee import *


db = SqliteDatabase(None, pragmas=[("foreign_keys", "ON")])


class BaseModel(Model):
    class Meta:
        database = db


class User(BaseModel):
    name = CharField(unique=True)
    password = CharField()
    token = CharField(null=True)
    email = CharField()
    reset_token = CharField(null=True)
    reset_date = DateTimeField(null=True)


class Restaurant(BaseModel):
    name = CharField()
    site = CharField()


class Lunch(BaseModel):
    creator = ForeignKeyField(User, related_name='created_lunches')
    restaurant = ForeignKeyField(Restaurant, related_name='lunches')
    order_date = DateTimeField()
    delivery_date = DateTimeField()
    status = IntegerField(default=0) # TODO(t.iwanek): choice field in peewee?


class Order(BaseModel):
    lunch = ForeignKeyField(Lunch, related_name='orders')
    user = ForeignKeyField(User, related_name='lunches')
    menu = CharField()
    price = IntegerField()


class Balance(BaseModel):
    first_user = ForeignKeyField(User, related_name='first_balance_user')
    second_user = ForeignKeyField(User, related_name='second_balance_user')
    value = IntegerField(default=0)


__all_models__ = [User, Restaurant, Lunch, Order, Balance]