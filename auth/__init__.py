from google.appengine.api import users
import rest

from google.appengine.ext import db
from models import project_model, note_model

class OwnerAuthorizer(rest.Authorizer):
    def can_read(self, dispatcher, model):
        user = users.get_current_user()
        model._editable = True if user == model.owner else False
        if model.__class__.__name__ == 'project_model':
            return
        if model.owner != users.get_current_user():
            dispatcher.not_found()

    def filter_read(self, dispatcher, models):
        ''' putem vedea proiectele noastre si cele in care suntem developeri '''
        if len(models) > 0 and models[0].__class__.__name__ == 'project_model':
            return self.filter_projects(models)
        ''' avem de filtrat notele: '''
        return self.filter_notes(models)
    
    def can_write(self, dispatcher, model, is_replace):
        user = users.get_current_user()
        model._editable = True if user == model.owner else False
        if(not model.is_saved()):
            #dispatcher.not_found()
            ''' are voie sa creeze un proiect nou, dar verificam daca are voie nota: '''
            if model.__class__.__name__ == 'note_model':
                if user not in model.project.developers + [ model.project.owner ]:
                    dispatcher.forbidden()
        elif model.owner != user:
            dispatcher.forbidden()

    def can_delete(self, dispatcher, model_type, model_key):
        ''' aceeasi politica si la Projects si la Notes: acces are doar owner-ul '''
        query = model_type.all().filter("owner = ", users.get_current_user()).filter("__key__ = ", model_key)
        if(len(query.fetch(1)) == 0):
            dispatcher.not_found()
        else:
            if model_type.__name__ == 'project_model':
                '''trebuie sa stergem de mana notele proiectului ca deh..'''
                for note in note_model.all().filter("project = ", model_key):
                    note.delete()
    def filter_projects(self, models):
        user = users.get_current_user()
        models = [model for model in models if user in [model.owner] + model.developers ]
        return self.add_permissions(models)

    def filter_notes(self, models):
        """ Functie care verifica daca exista acces pentru toate notele solicitate """
        user = users.get_current_user()
        models = [model for model in models if user in [model.project.owner] + model.project.developers ]
        return self.add_permissions(models)
    def add_permissions(self, models):
        user = users.get_current_user()
        for model in models:
            model._editable = True if model.owner == user else False
        return models