__author__ = 'Tomasz Iwanek'

import json
import unittest
import datetime
import functools

from whereismylunch.db import User, Lunch, Order, Restaurant, Balance, db, __all_models__
from whereismylunch.session import HTTP_HEADER_AUTHORIZATION_USER, HTTP_HEADER_AUTHORIZATION_PASSWORD, \
    HTTP_HEADER_AUTHORIZATION_TOKEN, create_session_token
from whereismylunch.utils import encode_password
from whereismylunch.wiml import app, open_db
from whereismylunch.mail import get_mail_sender, set_mail_sender, MailSender


def fake_mail_sender(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        backup_mail_sender = get_mail_sender()
        try:
            class FakeMailSender(MailSender):
                def __init__(self, *args, **kwargs):
                    super(FakeMailSender, self).__init__(*args, **kwargs);
                    self.reset_token = None
                    self.base_url = None
                    self.email = None
                    self.email = None
                    self.id = None
                    self.restaurant = None
                    self.status = None

                def send_reset_token_email(self, email, reset_token, base_url):
                    self.reset_token = reset_token
                    self.base_url = base_url
                    self.email = email

                def send_lunch_notification(self, email, id, restaurant, status):
                    self.email = email
                    self.id = id
                    self.restaurant = restaurant
                    self.status = status

            sender = FakeMailSender()
            set_mail_sender(sender)
            kwargs.update({"mail_sender": sender})
            func(*args, **kwargs)
        finally:
            set_mail_sender(backup_mail_sender)
    return wrapper


class AppTest(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        self.app = app.test_client()
        with app.app_context():
            open_db(':memory:')
            db.create_tables(__all_models__)
            with db.atomic():
                r = Restaurant(name="name", site="site")
                r.save()
                u1 = User(name="name", password=encode_password("pass"), email="email1@email.com")
                u1.save()
                u2 = User(name="name2", password=encode_password("pass2"), email="email2@email.com")
                u2.save()
                l = Lunch(creator=u1, restaurant=r, order_date=datetime.datetime.now(),
                          delivery_date=datetime.datetime.now())
                l.save()
                o = Order(lunch=l, user=u1, menu="menu", price=100)
                o.save()
                b = Balance(first_user=u1, second_user=u2)
                b.save()

    def _login_helper(self, name, password, code):
        rsp = self.app.post("user/login",
                    headers={
                        HTTP_HEADER_AUTHORIZATION_USER: name,
                        HTTP_HEADER_AUTHORIZATION_PASSWORD: password
                    })
        self.assertEqual(rsp.status_code, code)
        try:
            user_object = json.loads(rsp.data.decode("utf-8"))
            self.assertIn("id", user_object)
            self.assertIn("token", user_object)
            self.assertIn("name", user_object)
            self.assertEqual(user_object["name"], name)
            return user_object["token"]
        except json.decoder.JSONDecodeError:
            return ""


class UserTest(AppTest):
    def test_user_list(self):
        rsp = self.app.get("/user/")
        self.assertEqual(rsp.status_code, 200)
        result = json.loads(rsp.data.decode("utf-8"))
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]["name"], "name")

    def test_user_do_not_leak_password(self):
        rsp = self.app.get("/user/")
        self.assertEqual(rsp.status_code, 200)
        result = json.loads(rsp.data.decode("utf-8"))
        self.assertEqual(len(result), 2)
        self.assertNotIn("password", result[0])
        self.assertNotIn("token", result[0])

    def test_user_register(self):
        rsp = self.app.post("/user/register", data={'name': 'name3', 'password': 'pass', 'email': 'email1@email.com'})
        self.assertEqual(rsp.status_code, 200)
        rsp2 = self.app.get("/user/")
        self.assertEqual(rsp2.status_code, 200)
        result = json.loads(rsp2.data.decode("utf-8"))
        self.assertEqual(len(result), 3)
        self.assertTrue(any("name" in x and x["name"] == "name3" for x in result))

    def test_user_register_name_already_taken(self):
        rsp = self.app.post("/user/register", data={'name': 'name', 'password': 'pass', 'email': 'email1@email.com'})
        self.assertEqual(rsp.status_code, 409)

    def test_user_login(self):
        self._login_helper('name', 'pass', 200)

    def test_user_login_failure(self):
        self._login_helper('name', 'pass2', 403)

    def test_user_logout(self):
        token = self._login_helper('name', 'pass', 200)
        rsp = self.app.post("/user/logout", headers={HTTP_HEADER_AUTHORIZATION_TOKEN: token})
        self.assertEqual(rsp.status_code, 200)

    def test_user_edit(self):
        token = self._login_helper('name', 'pass', 200)
        rsp = self.app.put("/user/1",
                            data={'old_password': 'pass', 'password': 'pass2', 'email': 'email4@email.com'},
                            headers={HTTP_HEADER_AUTHORIZATION_TOKEN: token})
        self.assertEqual(rsp.status_code, 200)
        self._login_helper('name', 'pass', 403)
        self._login_helper('name', 'pass2', 200)

    def test_user_edit_bad_old_block(self):
        token = self._login_helper('name', 'pass', 200)
        rsp = self.app.put("/user/1",
                            data={'old_password': 'pppp', 'password': 'pass2', 'email': 'email4@email.com'},
                            headers={HTTP_HEADER_AUTHORIZATION_TOKEN: token})
        self.assertEqual(rsp.status_code, 403)
        self._login_helper('name', 'pass2', 403)
        self._login_helper('name', 'pass', 200)

    def test_user_edit_other_block(self):
        token = self._login_helper('name2', 'pass2', 200)
        rsp = self.app.put("/user/1",
                            data={'old_password': 'pass', 'password': 'pass2', 'email': 'email4@email.com'},
                            headers={HTTP_HEADER_AUTHORIZATION_TOKEN: token})
        self.assertEqual(rsp.status_code, 403)
        self._login_helper('name', 'pass2', 403)
        self._login_helper('name', 'pass2', 403)
        self._login_helper('name', 'pass', 200)

    @fake_mail_sender
    def test_user_reset_password_request(self, mail_sender=None):
        rsp = self.app.post("/user/reset_password",
                            data={'base_url': "http://127.0.0.1/base_url", 'email': 'email1@email.com'})
        self.assertEqual(rsp.status_code, 200)
        self.assertEqual(mail_sender.email, "email1@email.com")
        self.assertEqual(mail_sender.base_url, "http://127.0.0.1/base_url")
        self.assertGreater(len(mail_sender.reset_token), 0)

    @fake_mail_sender
    def test_user_reset_password_request_bad_email_block(self, mail_sender=None):
        rsp = self.app.post("/user/reset_password",
                            data={'base_url': "http://127.0.0.1/base_url", 'email': 'email1notexist@email.com'})
        self.assertEqual(rsp.status_code, 404)

    @fake_mail_sender
    def test_user_send_new_password(self, mail_sender=None):
        rsp = self.app.post("/user/reset_password",
                            data={'base_url': "http://127.0.0.1/base_url", 'email': 'email1@email.com'})
        self.assertEqual(rsp.status_code, 200)
        self.assertEqual(mail_sender.email, "email1@email.com")
        self.assertEqual(mail_sender.base_url, "http://127.0.0.1/base_url")
        self.assertGreater(len(mail_sender.reset_token), 0)
        rsp = self.app.post("/user/send_new_password", data={"token": mail_sender.reset_token, "password": "new_pass"})
        self.assertEqual(rsp.status_code, 200)

    @fake_mail_sender
    def test_user_send_new_password_twice(self, mail_sender=None):
        rsp = self.app.post("/user/reset_password",
                            data={'base_url': "http://127.0.0.1/base_url", 'email': 'email1@email.com'})
        self.assertEqual(rsp.status_code, 200)
        self.assertEqual(mail_sender.email, "email1@email.com")
        self.assertEqual(mail_sender.base_url, "http://127.0.0.1/base_url")
        self.assertGreater(len(mail_sender.reset_token), 0)
        rsp = self.app.post("/user/send_new_password", data={"token": mail_sender.reset_token, "password": "new_pass"})
        self.assertEqual(rsp.status_code, 200)
        rsp = self.app.post("/user/send_new_password", data={"token": mail_sender.reset_token, "password": "new_pass2"})
        self.assertEqual(rsp.status_code, 404)

    @fake_mail_sender
    def test_user_send_new_password_wrong_token_block(self, mail_sender=None):
        rsp = self.app.post("/user/send_new_password", data={"token": create_session_token(), "password": "new_pass2"})
        self.assertEqual(rsp.status_code, 404)


class RestaurantTest(AppTest):
    def test_restaurant_list(self):
        rsp = self.app.get("/restaurant/")
        self.assertEqual(rsp.status_code, 200)
        restaurant_list = json.loads(rsp.data.decode("utf-8"))
        self.assertEqual(len(restaurant_list), 1)
        self.assertEqual(restaurant_list[0]["name"],"name")
        self.assertEqual(restaurant_list[0]["site"], "site")

    def test_restaurant_add(self):
        token = self._login_helper('name', 'pass', 200)
        rsp = self.app.post("/restaurant/", headers={HTTP_HEADER_AUTHORIZATION_TOKEN: token},
                            data={"name": "r2", "site": "s2"})
        self.assertEqual(rsp.status_code, 200)
        rsp2 = self.app.get("/restaurant/")
        self.assertEqual(rsp2.status_code, 200)
        restaurant_list = json.loads(rsp2.data.decode("utf-8"))
        self.assertEqual(len(restaurant_list), 2) # TODO(t.iwanek): row order is not guaranteed...
        self.assertEqual(restaurant_list[1]["name"], "r2")
        self.assertEqual(restaurant_list[1]["site"], "s2")

    def test_restaurant_modify_name(self):
        token = self._login_helper('name', 'pass', 200)
        rsp = self.app.put("/restaurant/1", headers={HTTP_HEADER_AUTHORIZATION_TOKEN: token},
                            data={"name": "newone", "site": "newsite"})
        self.assertEqual(rsp.status_code, 200)
        rsp2 = self.app.get("/restaurant/")
        self.assertEqual(rsp2.status_code, 200)
        restaurant_list = json.loads(rsp2.data.decode("utf-8"))
        self.assertEqual(len(restaurant_list), 1)
        self.assertEqual(restaurant_list[0]["name"], "newone")
        self.assertEqual(restaurant_list[0]["site"], "newsite")


class LunchTest(AppTest):
    def test_lunch_list(self):
        rsp = self.app.get("/lunch/")
        self.assertEqual(rsp.status_code, 200)
        lunch_list = json.loads(rsp.data.decode("utf-8"))
        self.assertEqual(len(lunch_list), 1)

    def test_lunch_list_orders(self):
        rsp = self.app.get("/lunch/1/orders/")
        self.assertEqual(rsp.status_code, 200)
        order_list = json.loads(rsp.data.decode("utf-8"))
        self.assertEqual(len(order_list), 1)
        self.assertEqual(order_list[0]["lunch"]["creator"]["name"], "name")
        self.assertEqual(order_list[0]["user"]["name"], "name")
        self.assertEqual(order_list[0]["menu"], "menu")
        self.assertEqual(order_list[0]["price"], 100)

    def test_lunch_add(self):
        token = self._login_helper('name', 'pass', 200)
        rsp = self.app.post("/lunch/", headers={HTTP_HEADER_AUTHORIZATION_TOKEN: token},
                            data={"creator": 1, "restaurant": 1, "order_date": datetime.datetime.now(),
                                  "delivery_date": datetime.datetime.now()})
        self.assertEqual(rsp.status_code, 200)
        rsp2 = self.app.get("/lunch/")
        self.assertEqual(rsp2.status_code, 200)
        lunch_list = json.loads(rsp2.data.decode("utf-8"))
        self.assertEqual(len(lunch_list), 2)

    @fake_mail_sender
    def test_lunch_modify(self, mail_sender=None):
        token = self._login_helper('name', 'pass', 200)
        rsp = self.app.put("/lunch/1", headers={HTTP_HEADER_AUTHORIZATION_TOKEN: token},
                            data={"status": 1})
        self.assertEqual(rsp.status_code, 200)
        rsp2 = self.app.get("/lunch/")
        self.assertEqual(rsp2.status_code, 200)
        lunch_list = json.loads(rsp2.data.decode("utf-8"))
        self.assertEqual(len(lunch_list), 1)
        self.assertEqual(lunch_list[0]["status"], 1)
        self.assertEqual(mail_sender.email, "email1@email.com")
        self.assertEqual(mail_sender.id, 1)
        self.assertEqual(mail_sender.restaurant, "name")
        self.assertEqual(mail_sender.status, "Ordered")

    def test_lunch_modify_block(self):
        token = self._login_helper('name2', 'pass2', 200)
        rsp = self.app.put("/lunch/1", headers={HTTP_HEADER_AUTHORIZATION_TOKEN: token},
                            data={"status": 1})
        self.assertEqual(rsp.status_code, 403)

    @fake_mail_sender
    def test_lunch_modify_delivered(self, mail_sender=None):
        token = self._login_helper('name', 'pass', 200)
        rsp = self.app.put("/lunch/1", headers={HTTP_HEADER_AUTHORIZATION_TOKEN: token},
                            data={"status": 1})
        self.assertEqual(rsp.status_code, 200)
        rsp = self.app.put("/lunch/1", headers={HTTP_HEADER_AUTHORIZATION_TOKEN: token},
                           data={"status": 2})
        self.assertEqual(rsp.status_code, 200)
        self.assertEqual(mail_sender.email, "email1@email.com")
        self.assertEqual(mail_sender.id, 1)
        self.assertEqual(mail_sender.restaurant, "name")
        self.assertEqual(mail_sender.status, "Arrived")

    @fake_mail_sender
    def test_lunch_modify_cancel_ordered(self, mail_sender=None):
        token = self._login_helper('name', 'pass', 200)
        rsp = self.app.put("/lunch/1", headers={HTTP_HEADER_AUTHORIZATION_TOKEN: token},
                            data={"status": 1})
        self.assertEqual(rsp.status_code, 200)
        rsp = self.app.put("/lunch/1", headers={HTTP_HEADER_AUTHORIZATION_TOKEN: token},
                    data={"status": 3})
        self.assertEqual(rsp.status_code, 200)
        self.assertEqual(mail_sender.email, "email1@email.com")
        self.assertEqual(mail_sender.id, 1)
        self.assertEqual(mail_sender.restaurant, "name")
        self.assertEqual(mail_sender.status, "Cancelled")

    @fake_mail_sender
    def test_lunch_modify_cancel_created(self, mail_sender=None):
        token = self._login_helper('name', 'pass', 200)
        rsp = self.app.put("/lunch/1", headers={HTTP_HEADER_AUTHORIZATION_TOKEN: token},
                    data={"status": 3})
        self.assertEqual(rsp.status_code, 200)
        self.assertEqual(mail_sender.email, "email1@email.com")
        self.assertEqual(mail_sender.id, 1)
        self.assertEqual(mail_sender.restaurant, "name")
        self.assertEqual(mail_sender.status, "Cancelled")

    def test_lunch_modify_deliver_created_block(self):
        token = self._login_helper('name', 'pass', 200)
        rsp = self.app.put("/lunch/1", headers={HTTP_HEADER_AUTHORIZATION_TOKEN: token},
                    data={"status": 2})
        self.assertEqual(rsp.status_code, 403)

    def test_lunch_modify_deliver_deliver_canceled_block(self):
        token = self._login_helper('name', 'pass', 200)
        rsp = self.app.put("/lunch/1", headers={HTTP_HEADER_AUTHORIZATION_TOKEN: token},
                    data={"status": 3})
        self.assertEqual(rsp.status_code, 200)
        rsp = self.app.put("/lunch/1", headers={HTTP_HEADER_AUTHORIZATION_TOKEN: token},
            data={"status": 2})
        self.assertEqual(rsp.status_code, 403)


class OrderTest(AppTest):
    def test_order_list(self):
        rsp = self.app.get("/order/")
        self.assertEqual(rsp.status_code, 200)
        order_list = json.loads(rsp.data.decode("utf-8"))
        self.assertEqual(len(order_list), 1)

    def test_order_add(self):
        token = self._login_helper('name', 'pass', 200)
        rsp = self.app.post("/order/", headers={HTTP_HEADER_AUTHORIZATION_TOKEN: token},
                            data={"lunch": 1, "user": 1, "menu": "menu", "price": 999})
        self.assertEqual(rsp.status_code, 200)
        rsp2 = self.app.get("/order/")
        self.assertEqual(rsp2.status_code, 200)
        order_list = json.loads(rsp2.data.decode("utf-8"))
        self.assertEqual(len(order_list), 2)

    def test_order_modify(self):
        token = self._login_helper('name', 'pass', 200)
        rsp = self.app.put("/order/1", headers={HTTP_HEADER_AUTHORIZATION_TOKEN: token},
                            data={"menu": "newmenu"})
        self.assertEqual(rsp.status_code, 200)
        rsp2 = self.app.get("/order/")
        self.assertEqual(rsp2.status_code, 200)
        lunch_list = json.loads(rsp2.data.decode("utf-8"))
        self.assertEqual(len(lunch_list), 1)
        self.assertEqual(lunch_list[0]["menu"], "newmenu")

    def test_order_modify_block(self):
        token = self._login_helper('name2', 'pass2', 200)
        rsp = self.app.put("/order/1", headers={HTTP_HEADER_AUTHORIZATION_TOKEN: token},
                            data={"menu": "newmenu"})
        self.assertEqual(rsp.status_code, 403)

    def test_order_delete(self):
        token = self._login_helper('name', 'pass', 200)
        rsp = self.app.delete("/order/1", headers={HTTP_HEADER_AUTHORIZATION_TOKEN: token})
        self.assertEqual(rsp.status_code, 200)
        rsp2 = self.app.get("/order/")
        self.assertEqual(rsp2.status_code, 200)
        order_list = json.loads(rsp2.data.decode("utf-8"))
        self.assertEqual(len(order_list), 0)

    def test_order_delete(self):
        token = self._login_helper('name2', 'pass2', 200)
        rsp = self.app.delete("/order/1", headers={HTTP_HEADER_AUTHORIZATION_TOKEN: token})
        self.assertEqual(rsp.status_code, 403)

    def test_order_delete_lunch_ordered_block(self):
        token = self._login_helper('name', 'pass', 200)
        rsp = self.app.put("/lunch/1", headers={HTTP_HEADER_AUTHORIZATION_TOKEN: token},
                    data={"status": 1})
        self.assertEqual(rsp.status_code, 200)
        rsp = self.app.delete("/order/1", headers={HTTP_HEADER_AUTHORIZATION_TOKEN: token})
        self.assertEqual(rsp.status_code, 403)


class BalanceTest(AppTest):
    def test_balance_list(self):
        token = self._login_helper('name', 'pass', 200)
        rsp = self.app.get("/balance/1", headers={HTTP_HEADER_AUTHORIZATION_TOKEN: token})
        self.assertEqual(rsp.status_code, 200)
        balance_list = json.loads(rsp.data.decode("utf-8"))
        self.assertEqual(len(balance_list), 1)
        self.assertEqual(balance_list[0]["first_user"]["id"], 1)
        self.assertEqual(balance_list[0]["second_user"]["id"], 2)

    def test_balance_list_others_block(self):
        token = self._login_helper('name2', 'pass2', 200)
        rsp = self.app.get("/balance/1", headers={HTTP_HEADER_AUTHORIZATION_TOKEN: token})
        self.assertEqual(rsp.status_code, 403)

    def test_balance_add(self):
        token = self._login_helper('name', 'pass', 200)
        rsp = self.app.post("/balance/", data={"taker": 2, "giver": 1, "value": 112},
                            headers={HTTP_HEADER_AUTHORIZATION_TOKEN: token})
        self.assertEqual(rsp.status_code, 200)
        rsp = self.app.get("/balance/1", headers={HTTP_HEADER_AUTHORIZATION_TOKEN: token})
        self.assertEqual(rsp.status_code, 200)
        balance_list = json.loads(rsp.data.decode("utf-8"))
        self.assertEqual(len(balance_list), 1)
        self.assertEqual(balance_list[0]["first_user"]["id"], 1)
        self.assertEqual(balance_list[0]["second_user"]["id"], 2)
        self.assertEqual(balance_list[0]["value"], -112)

    def test_balance_add_self_block(self):
        token = self._login_helper('name', 'pass', 200)
        rsp = self.app.post("/balance/", data={"taker": 1, "giver": 2, "value": 112},
                            headers={HTTP_HEADER_AUTHORIZATION_TOKEN: token})
        self.assertEqual(rsp.status_code, 403)

    def test_balance_add_to_self_block(self):
        token = self._login_helper('name', 'pass', 200)
        rsp = self.app.post("/balance/", data={"taker": 1, "giver": 1, "value": 112},
                            headers={HTTP_HEADER_AUTHORIZATION_TOKEN: token})
        self.assertEqual(rsp.status_code, 400)

    def test_balance_add_negative_block(self):
        token = self._login_helper('name', 'pass', 200)
        rsp = self.app.post("/balance/", data={"taker": 2, "giver": 1, "value": -112},
                            headers={HTTP_HEADER_AUTHORIZATION_TOKEN: token})
        self.assertEqual(rsp.status_code, 400)

    def test_balance_added_after_arrived(self):
        token = self._login_helper('name2', 'pass2', 200)
        rsp = self.app.post("/order/", headers={HTTP_HEADER_AUTHORIZATION_TOKEN: token},
                            data={"lunch": 1, "user": 2, "menu": "menu", "price": 999})
        self.assertEqual(rsp.status_code, 200)
        token = self._login_helper('name', 'pass', 200)
        rsp = self.app.put("/lunch/1", headers={HTTP_HEADER_AUTHORIZATION_TOKEN: token},
                            data={"status": 1})
        self.assertEqual(rsp.status_code, 200)
        rsp = self.app.put("/lunch/1", headers={HTTP_HEADER_AUTHORIZATION_TOKEN: token},
                    data={"status": 2})
        self.assertEqual(rsp.status_code, 200)
        rsp = self.app.get("/balance/1", headers={HTTP_HEADER_AUTHORIZATION_TOKEN: token})
        self.assertEqual(rsp.status_code, 200)
        balance_list = json.loads(rsp.data.decode("utf-8"))
        self.assertEqual(len(balance_list), 1)
        self.assertEqual(balance_list[0]["first_user"]["id"], 1)
        self.assertEqual(balance_list[0]["second_user"]["id"], 2)
        self.assertEqual(balance_list[0]["value"], 999)


if __name__ == '__main__':
    unittest.main()