import angular from 'angular';
import _ from 'lodash';
import CodeMirror from 'codemirror';
import 'codemirror/mode/yaml/yaml.js';
import 'codemirror/addon/lint/lint.js';
import 'codemirror/addon/lint/yaml-lint.js';
import 'codemirror/addon/display/placeholder.js';

angular.module('portainer.app')
.factory('CodeMirrorService', function CodeMirrorService() {
  'use strict';

  var service = {};

  var codeMirrorGenericOptions = {
    lineNumbers: true
  };

  var codeMirrorYAMLOptions = {
    mode: 'text/x-yaml',
    gutters: ['CodeMirror-lint-markers'],
    lint: true
  };

  service.applyCodeMirrorOnElement = function(element, yamlLint, readOnly) {
    var options = angular.copy(codeMirrorGenericOptions);

    if (yamlLint) {
      _.assign(options, codeMirrorYAMLOptions);
    }

    if (readOnly) {
      options.readOnly = true;
    }

    var cm = CodeMirror.fromTextArea(element, options);
    cm.setSize('100%', 500);
    return cm;
  };

  return service;
});
