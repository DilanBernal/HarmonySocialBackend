import { NextFunction, Request, Response } from "express";

// Extender la interfaz Request para incluir parsedQuery
declare global {
  namespace Express {
    interface Request {
      parsedQuery?: Record<string, any>;
    }
  }
}

export default function parseNestedQuery(req: Request, res: Response, next: NextFunction) {
  const parsedQuery: Record<string, any> = {};

  for (const [key, value] of Object.entries(req.query)) {
    if (key.includes(".")) {
      const keys = key.split(".");
      let current = parsedQuery;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
    } else {
      if (key === "q") {
        parsedQuery["general_filter"] = value;
        continue;
      }
      parsedQuery[key] = value;
    }
  }

  req.parsedQuery = parsedQuery;
  next();
}
