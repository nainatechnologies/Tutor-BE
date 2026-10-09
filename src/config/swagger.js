const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { zodToJsonSchema } = require('zod-to-json-schema');

const authValidators = require('../modules/auth/validators/auth.validator');
const userValidators = require('../modules/users/validators/users.validator');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Tutor-BE API',
            version: '1.0.0',
            description: 'API documentation for the Tutor Platform Backend',
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                RegisterPayload: zodToJsonSchema(authValidators.registerSchema, "RegisterPayload").definitions.RegisterPayload,
                LoginPayload: zodToJsonSchema(authValidators.loginSchema, "LoginPayload").definitions.LoginPayload,
                SendOtpPayload: zodToJsonSchema(authValidators.sendOtpSchema, "SendOtpPayload").definitions.SendOtpPayload,
                ResetPasswordPayload: zodToJsonSchema(authValidators.resetPasswordSchema, "ResetPasswordPayload").definitions.ResetPasswordPayload,
                UpdateParentProfilePayload: zodToJsonSchema(userValidators.updateParentProfileSchema, "UpdateParentProfilePayload").definitions.UpdateParentProfilePayload,
                ChildPayload: zodToJsonSchema(userValidators.childSchema, "ChildPayload").definitions.ChildPayload,
            }
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    // Path to the files containing OpenAPI definitions
    apis: ['./src/docs/*.js'],
};

const specs = swaggerJsDoc(options);

module.exports = {
    swaggerUi,
    specs,
};
