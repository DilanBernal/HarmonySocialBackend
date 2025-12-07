// src/infrastructure/middleware/validateRequest.ts
import { Request, Response, NextFunction } from "express";
import { ObjectSchema } from "joi";

export function validateRequest(schema: ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log(req.body);
    if (!req.body) {
      return res.status(400).json({ message: "Request body is missing" });
    }
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });

    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details.map((d) => d.message),
      });
    }

    req.body = value;

    next();
  };
}
