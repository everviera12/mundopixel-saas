import { randomBytes } from "node:crypto";

import type { InventoryKind } from "./inventory";

// Alfabeto sin caracteres ambiguos (0/O y 1/I/L) para que el SKU se pueda
// dictar o capturar a mano sin confusiones.
const SKU_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function createSku(kind: InventoryKind) {
    const prefix = kind === "product" ? "PRD" : "INS";
    const bytes = randomBytes(6);
    let suffix = "";

    for (let index = 0; index < 6; index += 1) {
        suffix += SKU_ALPHABET[bytes[index] % SKU_ALPHABET.length];
    }

    return `${prefix}-${suffix}`;
}
