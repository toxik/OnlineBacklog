from google.appengine.ext import db
from google.appengine.api import users
from models import project_model

class note_model(db.Model):
    ''' din fericire are key implicit '''
    project		= db.ReferenceProperty(reference_class=project_model,
    							   required=True)
    description = db.TextProperty(required=True)
    owner 		= db.UserProperty(required=True, auto_current_user_add=True)
    pos_x 		= db.IntegerProperty()
    pos_y		= db.IntegerProperty()
    color		= db.StringProperty()
    created_at 	= db.DateTimeProperty(auto_now_add=True)
    modified_at	= db.DateTimeProperty(auto_now=True)
    _editable   = db.BooleanProperty()