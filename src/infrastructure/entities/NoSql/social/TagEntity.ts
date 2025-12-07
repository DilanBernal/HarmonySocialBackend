import { z } from "zod";

const TagEntity = z.string({ error: "El tag no puede estar vacio" });

export default TagEntity;
