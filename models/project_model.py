from google.appengine.ext import db
from google.appengine.api import users

class project_model(db.Model):
    ''' din fericire are key implicit '''
    title       = db.StringProperty(required=True)
    owner       = db.UserProperty(required=True, auto_current_user_add=True)
    developers  = db.ListProperty(users.User)
    created_at  = db.DateTimeProperty(auto_now_add=True)
    modified_at = db.DateTimeProperty(auto_now=True)
    _editable   = db.BooleanProperty()