import i18next from "i18next";

export enum SCRIPT_TYPE {
  SCRIPT = "script",
  ASSERT = "assert",
}

export const SCRIPT_LIST = [
  {
    name: i18next.t("common.script.pre_content.set_evariable"),
    value: 'pm.environment.set("key", "value");',
  },
  {
    name: i18next.t("common.script.pre_content.get_evariable"),
    value: 'pm.environment.get("key");',
  },
  {
    name: i18next.t("common.script.pre_content.del_evariable"),
    value: 'pm.environment.delete("key");',
  },
  {
    name: i18next.t("common.script.pre_content.get_environment_url"),
    value: "pm.environment.getPreUrl();",
  },
  {
    name: i18next.t("common.script.pre_content.get_environment_name"),
    value: "pm.environment.getName();",
  },
  {
    name: i18next.t("common.script.pre_content.get_evariable_list"),
    value: "pm.environment.getCollection();",
  },
  {
    name: i18next.t("common.script.pre_content.clear_evariable"),
    value: "pm.environment.clear();",
  },
  {
    name: i18next.t("common.script.pre_content.get_variable"),
    value: 'pm.variables.get("key")',
  },
  {
    name: i18next.t("common.script.pre_content.set_gvariable"),
    value: 'pm.globals.set("key", "value");',
  },
  {
    name: i18next.t("common.script.pre_content.get_gvariable"),
    value: 'pm.globals.get("key");',
  },
  {
    name: i18next.t("common.script.pre_content.del_gvariable"),
    value: 'pm.globals.delete("key");',
  },
  {
    name: i18next.t("common.script.pre_content.clear_gvariable"),
    value: "pm.globals.clear();",
  },
  {
    name: i18next.t("common.script.pre_content.set_query"),
    value: 'pm.setRequestQuery("key", "value");',
  },
  {
    name: i18next.t("common.script.pre_content.del_query"),
    value: 'pm.removeRequestQuery("key");',
  },
  {
    name: i18next.t("common.script.pre_content.set_header"),
    value: 'pm.setRequestHeader("key", "value");',
  },
  {
    name: i18next.t("common.script.pre_content.del_header"),
    value: 'pm.removeRequestHeader("key");',
  },
  {
    name: i18next.t("common.script.pre_content.set_body"),
    value: 'pm.setRequestBody("key", "value");',
  },
  {
    name: i18next.t("common.script.pre_content.del_body"),
    value: 'pm.removeRequestBody("key");',
  },
  {
    name: i18next.t("common.script.pre_content.set_body_format"),
    value: 'pm.setRequestBody({"key": "value"});',
  },
  {
    name: i18next.t("common.script.pre_content.send_request"),
    value: `pm.sendRequest("https://httpbin.org/anything", function (err, response) {
});
`,
  },
];

export const ASSERT_LIST = [
  {
    name: i18next.t("common.script.post_content.get_evariable"),
    value: 'pm.environment.get("variable_key");',
  },
  {
    name: i18next.t("common.script.post_content.get_gvariable"),
    value: 'pm.globals.get("variable_key");',
  },
  {
    name: i18next.t("common.script.post_content.get_variable"),
    value: 'pm.variables.get("variable_key");',
  },
  {
    name: i18next.t("common.script.post_content.set_evariable"),
    value: 'pm.environment.set("variable_key", "variable_value");',
  },
  {
    name: i18next.t("common.script.post_content.set_gvariable"),
    value: 'pm.globals.set("variable_key", "variable_value");',
  },
  {
    name: i18next.t("common.script.post_content.del_evariable"),
    value: 'pm.environment.unset("variable_key");',
  },
  {
    name: i18next.t("common.script.post_content.del_gvariable"),
    value: 'pm.globals.unset("variable_key");',
  },
  {
    name: i18next.t("common.script.post_content.send_request"),
    value: `pm.sendRequest("https://httpbin.org/anything", function (err, response) {
});
`,
  },
  {
    name: i18next.t("common.script.post_content.status"),
    value: `pm.test("${i18next.t("common.script.post_content.status")}", function () {
      pm.response.to.have.status(200);
    });`,
  },
  {
    name: i18next.t("common.script.post_content.test"),
    value: `pm.test("${i18next.t("common.script.post_content.test")}", function () {
      pm.expect(pm.response.text()).to.include("${i18next.t(
        "common.script.post_content.reg_str",
      )}");
    });`,
  },
  {
    name: i18next.t("common.script.post_content.errstr"),
    value: `pm.test("${i18next.t("common.script.post_content.json_errstr")}", function () {
      var jsonData = pm.response.json();
      pm.expect(jsonData.errstr).to.eql("success");
    });`,
  },
  {
    name: i18next.t("common.script.post_content.response_eq_str"),
    value: `pm.test("Response body equals a string", function () {
      pm.response.to.have.body("response_body_string");
    });`,
  },
  {
    name: i18next.t("common.script.post_content.content_type"),
    value: `pm.test("${i18next.t("common.script.post_content.content_type")}", function () {
      pm.response.to.have.header("Content-Type");
    });`,
  },
  {
    name: i18next.t("common.script.post_content.time"),
    value: `pm.test("${i18next.t("common.script.post_content.time")}", function () {
      pm.expect(pm.response.responseTime).to.be.below(200);
    });`,
  },
  {
    name: i18next.t("common.script.post_content.successful_post_request"),
    value: `pm.test("${i18next.t(
      "common.script.post_content.successful_post_request",
    )}", function () {
      pm.expect(pm.response.code).to.be.oneOf([201, 202]);
    });`,
  },
  {
    name: i18next.t("common.script.post_content.status_code_contains_string"),
    value: `pm.test("${i18next.t(
      "common.script.post_content.status_code_contains_string",
    )}", function () {
        pm.response.to.have.status("Created");
    });`,
  },
  {
    name: i18next.t("common.script.post_content.xml_to_json"),
    value: "var jsonObject = xml2Json(responseBody);",
  },
  {
    name: i18next.t("common.script.post_content.json"),
    value: `var schema = {
        "items": {
            "type": "boolean"
        }
    };

    var data1 = [true, false];
    var data2 = [true, 123];

    pm.test('Schema is valid', function () {
        pm.expect(tv4.validate(data1, schema)).to.be.true;
        pm.expect(tv4.validate(data2, schema)).to.be.true;
    });`,
  },
];
