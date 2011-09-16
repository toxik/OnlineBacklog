#!/usr/bin/env python
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from models import project_model, note_model
import auth
import rest

class LogoutHandler(webapp.RequestHandler):
    def get(self):
        self.redirect(users.create_logout_url("/"))

rest.Dispatcher.base_url = "/rest"
rest.Dispatcher.add_models({
    "Note": note_model,
    "Project": project_model
})
rest.Dispatcher.authorizer = auth.OwnerAuthorizer()
#rest.Dispatcher.caching = True // nu este tocmai inteligent..

        
def main():
    application = webapp.WSGIApplication([
            ('/rest/.*', rest.Dispatcher),('/logout', LogoutHandler)
        ])
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()