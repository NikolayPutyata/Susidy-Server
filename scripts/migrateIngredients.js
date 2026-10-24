import 'dotenv/config';
import mongoose from 'mongoose';
import { ProductsCollection } from '../src/db/models/products.js';
import { INGREDIENTS, INGREDIENT_IDS } from '../src/constants/ingredients.js';
import { getEnvVar } from '../src/utils/getEnvVar.js';

// Converts the old hand-typed ingredient tags ("сир, креветка, лосось")
// into dictionary ids ("cheese", "shrimp", "salmon"). Dry run by default —
// prints what would change; pass --apply to write. Tags that match no
// dictionary entry are dropped and listed, so the admin can re-pick them
// with the chip selector. Safe to re-run: already-converted ids map to
// themselves.
const apply = process.argv.includes('--apply');

const idByAlias = new Map();
for (const { id, aliases } of INGREDIENTS) {
  idByAlias.set(id, id);
  for (const alias of aliases) idByAlias.set(alias.toLowerCase(), id);
}

const run = async () => {
  await mongoose.connect(getEnvVar('MONGODB_URI'));

  const products = await ProductsCollection.find(
    { 'ingredients.0': { $exists: true } },
    { name: 1, ingredients: 1 },
  ).lean();

  let changed = 0;
  for (const product of products) {
    const ids = [];
    const unknown = [];
    for (const tag of product.ingredients) {
      const id = idByAlias.get(tag.trim().toLowerCase());
      if (id && !ids.includes(id)) ids.push(id);
      if (!id) unknown.push(tag);
    }

    const same =
      ids.length === product.ingredients.length &&
      ids.every((id, i) => id === product.ingredients[i]);
    if (same) continue;

    changed += 1;
    console.log(
      `${product.name}: [${product.ingredients.join(', ')}] → [${ids.join(', ')}]` +
        (unknown.length ? `  (не розпізнано: ${unknown.join(', ')})` : ''),
    );
    if (apply) {
      await ProductsCollection.updateOne(
        { _id: product._id },
        { $set: { ingredients: ids } },
      );
    }
  }

  console.log(
    `${changed} of ${products.length} products ${apply ? 'updated' : 'would change (dry run — add --apply to write)'}. Valid ids: ${INGREDIENT_IDS.join(', ')}`,
  );
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
