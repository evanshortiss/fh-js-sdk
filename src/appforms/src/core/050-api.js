/**
 * FeedHenry License
 */
appForm.api = function (module) {
  module.getForms = getForms;
  module.getForm = getForm;
  module.getTheme = getTheme;
  module.submitForm = submitForm;
  module.getSubmissions = getSubmissions;
  module.init = appForm.init;
  module.log=appForm.models.log;
  var _submissions = null;
  var formConfig = appForm.models.config;

  /**
   * Get and set config values. Can only set a config value if you are an config_admin_user
   */
  var configInterface = {
    "editAllowed" : function(){
      var defaultConfigValues = formConfig.get("defaultConfigValues", {});
      return defaultConfigValues["config_admin_user"] === true;
    },
    "get" : function(key){
      if(key){
        var userConfigValues = formConfig.get("userConfigValues", {});
        var defaultConfigValues = formConfig.get("defaultConfigValues", {});

        if(userConfigValues[key]){
          return userConfigValues[key];
        } else {
          return defaultConfigValues[key];
        }
      } else {
        return null;
      }
    },
    "set" : function(key, val){
      var self = this;
      if(!key || !val){
        return;
      }

      if(self.editAllowed()){
        var userConfig = formConfig.get("userConfigValues", {});
        userConfig[key] = val;
        formConfig.set("userConfigValues", userConfig);
      }
    },
    "getConfig" : function(){
      var self = this;
      var defaultValues = formConfig.get("defaultConfigValues", {});
      var userConfigValues = formConfig.get("userConfigValues", {});
      var returnObj = {};

      if(self.editAllowed()){
        for(var defKey in defaultValues){
          if(userConfigValues[defKey]){
            returnObj[defKey] = userConfigValues[defKey];
          } else {
            returnObj[defKey] = defaultValues[defKey];
          }
        }
        return returnObj;
      } else {
        return defaultValues;
      }
    },
    "saveConfig": function(cb){
      var self = this;

      if(self.editAllowed()){
        formConfig.saveLocal(function(err, configModel){
          cb(err, self.getConfig());
        });
      } else {
        cb("Error, config administration rights required to save changes to config.");
      }
    }
  };

  module.config = configInterface;


  /**
     * Retrieve forms model. It contains forms list. check forms model usage
     * @param  {[type]}   params {fromRemote:boolean}
     * @param  {Function} cb    (err, formsModel)
     * @return {[type]}          [description]
     */
  function getForms(params, cb) {
    var fromRemote = params.fromRemote;
    if (fromRemote === undefined) {
      fromRemote = false;
    }
    appForm.models.forms.refresh(fromRemote, cb);
  }
  /**
     * Retrieve form model with specified form id.
     * @param  {[type]}   params {formId: string, fromRemote:boolean}
     * @param  {Function} cb     (err, formModel)
     * @return {[type]}          [description]
     */
  function getForm(params, cb) {
    new appForm.models.Form(params, cb);
  }
  /**
     * Find a theme definition for this app.
     * @param params {fromRemote:boolean(false)}
     * @param {Function} cb {err, themeData} . themeData = {"json" : {<theme json definition>}, "css" : "css" : "<css style definition for this app>"}
     */
  function getTheme(params, cb) {
    var theme = appForm.models.theme;
    if (!params.fromRemote) {
      params.fromRemote = false;
    }
    theme.refresh(params.fromRemote, function (err, updatedTheme) {
      if (err)
        return cb(err);
      if (updatedTheme === null) {
        return cb(new Error('No theme defined for this app'));
      }
      if (params.css === true) {
        return cb(null, theme.getCSS());
      } else {
        return cb(null, theme);
      }
    });
  }
  /**
     * Get submissions that are submitted. I.e. submitted and complete.
     * @param params {}
     * @param {Function} cb     (err, submittedArray)
     */
  function getSubmissions(params, cb) {
    //Getting submissions that have been completed.
    var submissions = appForm.models.submissions;
    if (_submissions == null) {
      appForm.models.submissions.loadLocal(function (err) {
        if (err) {
          console.error(err);
          cb(err);
        } else {
          _submissions = appForm.models.submissions;
          cb(null, _submissions);
        }
      });
    } else {
      setTimeout(function () {
        cb(null, _submissions);
      }, 0);
    }
  }
  function submitForm(submission, cb) {
    if (submission) {
      submission.submit(function (err) {
        if (err)
          return cb(err);
        //Submission finished and validated. Now upload the form
        submission.upload(cb);
      });
    } else {
      return cb('Invalid submission object.');
    }
  }
  return module;
}(appForm.api || {});
//mockup $fh apis for Addons.
if (typeof $fh == 'undefined') {
  $fh = {};
}
if ($fh.forms === undefined) {
  $fh.forms = appForm.api;
}