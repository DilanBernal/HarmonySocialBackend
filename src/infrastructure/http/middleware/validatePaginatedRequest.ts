import { NextFunction, Request, Response } from "express";
import { ObjectSchema } from "joi";
import paginatedRequestValidator from "../../validator/util/paginatedRequest";

export function validatePaginatedRequest<T>(schema: ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.query) {
      return res.status(400).json({ message: "Request body is missing" });
    }
    const { error: errorPagSchema, value: valuePagSchema } = paginatedRequestValidator.validate(
      req.parsedQuery,
      { abortEarly: false, stripUnknown: true },
    );

    if (errorPagSchema) {
      return res.status(400).json({
        message: "Validation error",
        details: errorPagSchema.details.map((d: any) => d.message),
      });
    }

    const { error: errorFilters, value: valueFilters } = schema.validate(req.parsedQuery?.filters, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (errorFilters) {
      return res.status(400).json({
        message: "Validation error",
        details: errorFilters.details.map((d: any) => d.message),
      });
    }

    if (valueFilters) valuePagSchema.filters = valueFilters;

    req.parsedQuery = valuePagSchema;
    next();
  };
}
