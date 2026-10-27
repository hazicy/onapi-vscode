export default {
  type: "object",
  properties: {
    project_id: {
      type: "string",
    },
    name: {
      type: "string",
    },
    intro: {
      type: "string",
    },
    apis: {
      type: "array",
      items: {},
    },
  },
  required: ["name", "intro", "apis"],
};
