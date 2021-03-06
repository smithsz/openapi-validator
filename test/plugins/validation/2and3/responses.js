const expect = require('expect');
const {
  validate
} = require('../../../../src/plugins/validation/2and3/semantic-validators/responses');

const config = require('../../../../src/.defaultsForValidator').defaults.shared;

describe('validation plugin - semantic - responses', function() {
  describe('inline response schemas', function() {
    describe('Swagger 2', function() {
      it('should not complain for a valid response', function() {
        const spec = {
          paths: {
            '/stuff': {
              get: {
                summary: 'list stuff',
                operationId: 'listStuff',
                produces: ['application/json'],
                responses: {
                  200: {
                    description: 'successful operation',
                    schema: {
                      $ref: '#/definitions/ListStuffResponseModel'
                    }
                  }
                }
              }
            }
          }
        };

        const res = validate({ jsSpec: spec }, config);
        expect(res.warnings.length).toEqual(0);
        expect(res.errors.length).toEqual(0);
      });

      it('should complain about an inline schema', function() {
        const spec = {
          paths: {
            '/stuff': {
              get: {
                summary: 'list stuff',
                operationId: 'listStuff',
                produces: ['application/json'],
                responses: {
                  200: {
                    description: 'successful operation',
                    schema: {
                      type: 'object',
                      properties: {
                        stuff: {
                          type: 'string'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        };

        const res = validate({ jsSpec: spec }, config);
        expect(res.warnings.length).toEqual(1);
        expect(res.warnings[0].path).toEqual([
          'paths',
          '/stuff',
          'get',
          'responses',
          '200',
          'schema'
        ]);
        expect(res.warnings[0].message).toEqual(
          'Response schemas should be defined with a named ref.'
        );
        expect(res.errors.length).toEqual(0);
      });

      it('should not complain for a response with no schema', function() {
        const spec = {
          paths: {
            '/stuff': {
              get: {
                summary: 'list stuff',
                operationId: 'listStuff',
                produces: ['application/json'],
                responses: {
                  200: {
                    description: 'successful operation'
                  }
                }
              }
            }
          }
        };

        const res = validate({ jsSpec: spec }, config);
        expect(res.warnings.length).toEqual(0);
        expect(res.errors.length).toEqual(0);
      });

      it('should not complain about a bad pattern within an extension', function() {
        const spec = {
          paths: {
            '/stuff': {
              get: {
                summary: 'list stuff',
                operationId: 'listStuff',
                produces: ['application/json'],
                responses: {
                  'x-response-extension': {
                    description: 'successful operation',
                    schema: {
                      type: 'object',
                      properties: {
                        stuff: {
                          type: 'string'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        };

        const res = validate({ jsSpec: spec }, config);
        expect(res.warnings.length).toEqual(0);
        expect(res.errors.length).toEqual(0);
      });
    });

    describe('OpenAPI 3', function() {
      it('should not complain for a valid response', function() {
        const spec = {
          paths: {
            '/stuff': {
              get: {
                summary: 'list stuff',
                operationId: 'listStuff',
                responses: {
                  200: {
                    description: 'successful operation',
                    content: {
                      'application/json': {
                        schema: {
                          $ref: '#/components/schemas/ListStuffResponseModel'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        };

        const res = validate({ jsSpec: spec, isOAS3: true }, config);
        expect(res.warnings.length).toEqual(0);
        expect(res.errors.length).toEqual(0);
      });

      it('should complain about an inline schema', function() {
        const spec = {
          paths: {
            '/stuff': {
              get: {
                summary: 'list stuff',
                operationId: 'listStuff',
                responses: {
                  200: {
                    description: 'successful operation',
                    content: {
                      'application/json': {
                        schema: {
                          type: 'object',
                          properties: {
                            stuff: {
                              type: 'string'
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        };

        const res = validate({ jsSpec: spec, isOAS3: true }, config);
        expect(res.warnings.length).toEqual(1);
        expect(res.warnings[0].path).toEqual([
          'paths',
          '/stuff',
          'get',
          'responses',
          '200',
          'content',
          'application/json',
          'schema'
        ]);
        expect(res.warnings[0].message).toEqual(
          'Response schemas should be defined with a named ref.'
        );
        expect(res.errors.length).toEqual(0);
      });

      it('should not complain for a response with no schema', function() {
        const spec = {
          paths: {
            '/stuff': {
              get: {
                summary: 'list stuff',
                operationId: 'listStuff',
                responses: {
                  200: {
                    description: 'successful operation'
                  }
                }
              }
            }
          }
        };

        const res = validate({ jsSpec: spec, isOAS3: true }, config);
        expect(res.warnings.length).toEqual(0);
        expect(res.errors.length).toEqual(0);
      });

      it('should complain when a response component has an inline schema', function() {
        const spec = {
          components: {
            responses: {
              ListStuffResponse: {
                description: 'successful operation',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        stuff: {
                          type: 'string'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        };

        const res = validate({ jsSpec: spec, isOAS3: true }, config);
        expect(res.warnings.length).toEqual(1);
        expect(res.warnings[0].path).toEqual([
          'components',
          'responses',
          'ListStuffResponse',
          'content',
          'application/json',
          'schema'
        ]);
        expect(res.warnings[0].message).toEqual(
          'Response schemas should be defined with a named ref.'
        );
        expect(res.errors.length).toEqual(0);
      });
    });
  });
});
