WhereIsMyLunch
==============

Web application for creating lunch orders and money balance tracking in your office.

This project was created just for fun to learn AngularJS_/Flask_ basics (it has no real use ;) ).

Application helps in following aspects:
 - sharing information about who and what will order,
 - preparing list of lunch participants,
 - notifying about order arrival (via registered email),
 - (optionally) calculating money balance between users.

Architecture
------------

Application contains two separate components:

1. Flask application serving REST API for a few resources that needs to be stored,
2. Angular (SPA) application that provides user interface and interacts with flask backend.

Setup for development
---------------------

Setup for testing app as follows:

1. Running backend:

.. code:: bash

    cd backend/
    sudo pip-3.3 install -r requirements.txt
    python3 manage.py runtests
    python3 manage.py createdb
    python3 manage.py runserver
    
2. Running frontend:

.. code:: bash

    cd web/
    npm install
    npm test
    npm run build
    npm start
    
Application should be available at: http://127.0.0.1:8000

To fake smtp server on localhost which is needed for password reset functionality, type in shell:

.. code:: bash

    sudo python -m smtpd -n -c DebuggingServer localhost:25

TODOs
-----

 - CSRF,
 - serve over https,
 - in-app lunch notification,
 - in-app order notification for creator of lunch,
 - messaging between users,
 - lunch comments (e.g. agh, this was awful...),
 - restaurant comments (e.g. I'd would recommend it to everyone...),
 - more tests,
 - production setup :>.
    
-------------------------------------------------------------------------------------------------------

.. _AngularJS: https://angularjs.org/
.. _Flask: http://flask.pocoo.org/

:Authors:
  Tomasz Iwanek