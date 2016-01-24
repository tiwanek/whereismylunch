__author__ = 'Tomasz Iwanek'

import getpass
import smtplib
import socket


class MailDeliverException(Exception):
    pass


class MailSender:
    def send(self, email, title, text):
        server = "localhost"
        sender = "%s@%s" %(getpass.getuser(), socket.gethostname())
        receiver = [email] # must be a list
        subject = "[WhereIsMyLunch] %s" % title
        message = "From: %s\nTo: %s\nSubject: %s\n\n%s" % (sender, ", ".join(receiver), subject, text)

        try:
            server = smtplib.SMTP(server)
            server.sendmail(sender, receiver, message)
            server.quit()
        except socket.error:
            raise MailDeliverException()

    def send_reset_token_email(self, email, reset_token, base_url):
        subject = "Password reset"
        text = "You have requested password reset. " +\
               "Here is link to change your password:\n%s/%s" % (base_url, reset_token)
        self.send(email, subject, text)

    def send_lunch_notification(self, email, id, restaurant, status):
        subject = "Lunch notification"
        text = "Lunch %d (in %s) changed its status to: %s" % (id, restaurant, status)
        self.send(email, subject, text)



_mail_sender = MailSender()


def set_mail_sender(sender):
    global _mail_sender
    _mail_sender = sender


def get_mail_sender():
    return _mail_sender