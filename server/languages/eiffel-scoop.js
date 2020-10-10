/**
 * Created by hce on 08/07/15.
 *
 * Language properties file projects of type Java-JUnit.
 */

'use strict';

var util = require('../util.js'),
  CONST = require('../config/const.js');

module.exports = {

  // name of the language
  name: CONST.LANGUAGE_NAME.EIFFEL_SCOOP,

  // file extension of the source files
  filenameExtension: '.e',

  // is this a static or dynamic language? e.g. Python is dynamic
  isDynamicLanguage: false,

  // does the language come with supports for (unit) tests?
  isLanguageWithTestSupport: false,

  // name of the docker image that is used to execute "compile" or "run" for this language
  dockerImage: 'cobo/eiffel',

  // timeout settings that will apply to all containers of this language
  timeoutSettings: {
    // time (sec) that's the maximum allowed CPU usage time
    cpu: 300,
    // time (sec) that's the maximum allowed session time, i.e. the time before a running container is terminated
    session: 900, // 15 minutes
    // time (sec) that's the maximum allowed session time in case a session is NOT a WS streaming session (i.e. no user input)
    // Note that the timeoutCPU still applies
    sessionNoStream: 20
  },

  // path of the working directory relative to the folder with the mantraId (used when we need to move into "/Root")
  // e.g. value "Root" would allow us to construct /tmp/projects/mantraId/ + ./Root
  dockerWorkingDirRel: 'Root',

  // is a codeboard configuration file (e.g. codeboard.json) required and (if yes) which properties must it provide
  codeboardConfig: {
    isRequired: false,
    expectedProperties: []
  },


  /**
   * Function returns the command to run a project of this language.
   * @param {object} aCodeboardConfig the codeboardConfig object
   */
  getCommandForRunAction: function (aCodeboardConfig) {

    // Note: this shouldn't be hard-coded here, but for now, Eiffel doesn't have a codeboard.json file
    var eiffelCoboConfig = {
      ecf: 'project.ecf',
      target: 'project'
    };

    var cmd = './EIFGENs/' + eiffelCoboConfig.target + '/W_code/' + eiffelCoboConfig.target;
    return cmd;
  },


  /**
   * Function returns the command to compile a project of this language.
   * @param {file[]} aFiles array of source files
   * @param {object} aCodeboardConfig the codeboardConfig object
   */
  getCommandForCompileAction: function (aFiles, aCodeboardConfig) {

    // Note: this shouldn't be hard-coded here, but for now, Eiffel doesn't have a codeboard.json file
    var eiffelCoboConfig = {
      ecf: 'project.ecf',
      target: 'project'
    };

    var compileCmd = 'ecb -batch -config ' + eiffelCoboConfig.ecf + ' -target ' + eiffelCoboConfig.target + ' -c_compile';
    return compileCmd;
  },


  /**
   * Function takes a compiler output as argument and returns "true" if that output
   * implies that the compilation had one or more errors.
   * By default (e.g. for dynamic languages) this function should return false.
   * @param {string} aCompilerOutput  the output generated by the compiler
   * @returns {boolean} true is "aCompilerOutput" represents compilation errors (by default false)
   */
  hasCompilationErrors: function (aCompilerOutput) {

    // TODO: this is a copy/paste from Mantra1. It needs (a lot of) simplification and refactoring.

    /**
     * Takes a string 'input', and extracts the substring 'start' until 'end' omitting the 'start' characters
     * For example: if input is "Warning code: XXP\n", start: "Warning code" and end: "/n" it returns "XXP"
     * This function is used to extract error items from Eiffel compilation
     */
    var extractSubErrorItem = function (input, start, end) {
      if (input.indexOf(start) != -1 && input.indexOf(end) != -1) {
        input = input.substring(input.indexOf(start), input.length); // remove everything before 'start'
        return input.substring(input.indexOf(start) + start.length + 1, input.indexOf(end));
      }
      else {
        return ' ';
      }
    };


    /**
     * Takes an string that contains an Eiffel error or warning and split it in a compilation error/warning object
     * requires: string s formatted as a warning/error
     * ensures result formatted as:
     *  result.warning
     *  result.code
     *  result.what
     *  result.className
     *  result.featureName
     *  result.line
     *  result.description
     * OR
     *  result.error
     *  result.code
     *  result.what
     *  result.className
     *  result.featureName
     *  result.line
     *  result.description
     */
    var parseEiffelErrorWarningItem = function (input) {
      var result = {};
      var indexWarning = input.indexOf("Warning code:");
      var indexError = input.indexOf("Error code:");
      if (indexError == -1) {
        indexError = input.indexOf("Syntax error");
      }
      if (indexWarning != -1) {
        // extracts the warning object
        input = input.substring(indexWarning, input.length);
        var descr = input;
        result.code = extractSubErrorItem(input, "Warning code:", "\n");
        result.warning = extractSubErrorItem(input, "Warning:", "\n");
        result.what = extractSubErrorItem(input, "What to do:", "\n");
        result.className = extractSubErrorItem(input, "Class:", "\n\n");
        result.featureName = extractSubErrorItem(input, "Feature:", "\n");
        result.line = extractSubErrorItem(input, "Line:", "\n");
        //descr = descr.replace(/(\r\n)+/g, "\n");
        //descr = descr.replace(/(\n)+/g, "\n");
        result.description = descr;
        return result;
      }
      if (indexError != -1) {
        //extracts the error object
        input = input.substring(indexError, input.length);
        var descr = input;
        result.code = extractSubErrorItem(input, "Error code:", "\r\n\r\n");
        result.error = extractSubErrorItem(input, "Error:", "\r\n");
        if (result.error === ' ') {
          result.error = extractSubErrorItem(input, "Type error:", "\r\n");
        }
        if (result.error === ' ') {
          result.error = extractSubErrorItem(input, "Syntax error", "\r\n");
          // console.log('Syntax error ' + result.error)
        }
        result.what = extractSubErrorItem(input, "What to do:", "\r\n\r\n");
        result.className = extractSubErrorItem(input, "Class:", "\r\n");
        result.featureName = extractSubErrorItem(input, "Feature:", "\r\n");
        result.line = extractSubErrorItem(input, "Line:", "\r\n");
        descr = descr.replace(/(\r\n)+/g, "\n");
        descr = descr.replace(/(\n)+/g, "\n");
        result.description = descr;
        return result;
      }
      return result;
    };


    var result = {};
    result.dump = aCompilerOutput;
    result.compilationError = false;
    result.warningError = false;
    result.errors = [];
    result.warnings = [];
    var numberErrors = 0;
    var numberWarnings = 0;
    var index = aCompilerOutput.indexOf("System Recompiled.");
    var index2 = aCompilerOutput.indexOf("-----------------");
    if (index != -1 && index2 == -1) {
      // there are no compilation errors and no warnings
      result.output = aCompilerOutput;
    }
    else {
      var out = aCompilerOutput.substring(0, index2); // remove until '------------'
      result.output = out;
      var items = aCompilerOutput.split(/----*/); // gets an array of errors or warnings
      for (var i = 0; i < items.length; i++) {
        var parsedItem = parseEiffelErrorWarningItem(items[i]); // process one error or warning;
        // it migth return an empty object if the item was not an error nor a warning
        if (parsedItem.warning != undefined) {
          // the item is a warning
          result.warnings[numberWarnings] = parsedItem; // replace length by 'number'
          numberWarnings++;
        }
        if (parsedItem.error != undefined) {
          // the item is an error
          result.errors[numberErrors] = parsedItem;
          numberErrors++;
        }
      }
      if (numberErrors > 0) {
        result.compilationError = true;
      }
      if (numberWarnings > 0) {
        result.warningError = true;
      }
    }

    return result.compilationError;
  }
};
