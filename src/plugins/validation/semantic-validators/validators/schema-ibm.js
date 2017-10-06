// Assertation 1:
// Schemas need to have properly matching type/format pairs

// Assertation 2:
// Properties within schema objects should have descriptions

// Assertation 3:
// Schema property descriptions should not state that model will be a JSON object

import each from "lodash/each"
import forIn from "lodash/forIn"
import includes from "lodash/includes"

export function validate({ jsSpec }) {
  let errors = []
  let warnings = []

  let schemas = []

  if(jsSpec.definitions) {
    each(jsSpec.definitions, (def, name) => {
      def.name = name
      schemas.push({ schema: def, path: ["definitions", name] })
    })
  }

  if(jsSpec.responses) {
    each(jsSpec.responses, (response, name) => {
      if(response.schema && !response.schema.$ref) {
        schemas.push({ schema: response.schema, path: ["responses", name, "schema"] })
      }
    })
  }

  if(jsSpec.paths) {
    each(jsSpec.paths, (path, pathName) => {
      each(path, (op, opName) => {
        if(op && op.parameters) {
          op.parameters.forEach((parameter, parameterIndex) => {
            if(parameter.in === "body" && parameter.schema && ! parameter.schema.$ref) {
              schemas.push({
                schema: parameter.schema,
                path: ["paths", pathName, opName, "parameters", parameterIndex.toString(), "schema"]
              })
            }
          })
        }
        if(op && op.responses) {
          each(op.responses, (response, responseName) => {
            if(response && response.schema && !response.schema.$ref) {
              schemas.push({
                schema: response.schema,
                path: ["paths", pathName, opName, "responses", responseName, "schema"]
              })
            }
          })
        }
      })
    })
  }

  schemas.forEach(({ schema, path }) => {
    errors.push(...generateFormatErrors(schema, path))
    warnings.push(...generateDescriptionWarnings(schema, path))
  })

  return { errors, warnings }
}

// Flag as an error any property that does not have a recognized "type" and "format" according to the
// [Swagger 2.0 spec](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#data-types)
function generateFormatErrors(schema, contextPath) {
  let arr = []

  if(!schema.properties) { return arr }

  forIn( schema.properties, (property, propName) => {
    if (property.$ref) { return }
    var path = contextPath.concat(["properties",propName,"type"])
    var valid = true
    switch (property.type) {
      case "integer":
      case "number":
      case "string":
      case "boolean":
        valid = formatValid(property)
        break
      case "array":
        path = contextPath.concat(["properties",propName,"items","type"])
        valid = formatValid(property.items)
        break
      case "object":
        valid = true   // TODO: validate nested schemas
        break
      default:
        valid = false
    }

    if (!valid) {
      arr.push({
        path: path,
        message: "Properties must use well defined property types."
      })
    }
  })

  return arr
}

function formatValid(property) {
  if (property.$ref) { return true }
  var valid = true
  switch (property.type) {
    case "integer":
      valid = (!property.format) || includes(["int32","int64"], property.format.toLowerCase())
      break
    case "number":
      valid = (!property.format) || includes(["float","double"], property.format.toLowerCase())
      break
    case "string":
      valid = (!property.format) || includes(["byte","binary","date","date-time","password"], property.format.toLowerCase())
      break
    case "boolean":
      valid = (property.format === undefined)   // No valid formats for boolean -- should be omitted
      break
    case "object":
      valid = true   // TODO: validate nested schemas
      break
    default:
      valid = false
  }
  return valid
}

// http://watson-developer-cloud.github.io/api-guidelines/swagger-coding-style#models
function generateDescriptionWarnings(schema, contextPath) {

  let arr = []

  if(!schema.properties) { return arr }

  // verify that every property of the model has a description
  forIn( schema.properties, (property, propName) => {

    // if property is defined by a ref, it does not need a description
    if (property.$ref) { return }

    var path = contextPath.concat(["properties", propName, "description"])

    let hasDescription = property.description && property.description.toString().trim().length 
    if (!hasDescription) {
      arr.push({
        path,
        message: "Schema properties must have a description with content in it."
      })
    }
    else {
      // if the property does have a description, "Avoid describing a model as a 'JSON object' since this will be incorrect for some SDKs."
      let mentionsJSON = includes(property.description.toLowerCase(), "json")
      if (mentionsJSON) {
        arr.push({
          path: path,
          message: "Not all languages use JSON, so descriptions should not state that the model is a JSON object."
        })
      }
    }
  })

  return arr
}