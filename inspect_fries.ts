
import { INITIAL_STATE } from "./src/initialData";

const S = INITIAL_STATE;
console.log("=== INGREDIENTS ===");
S.ing.forEach((g, idx) => {
  if (g.name.includes("بوم فريت") || g.name.includes("بطاطس")) {
    console.log(g.id, "|", g.name, "| Unit:", g.unit, "| Price:", g.price, "| Yield:", g.yield, "| Beg:", S.beg[idx], "| End:", S.end[idx]);
  }
});

console.log("
=== RECIPES CONTAINING بوم فريت OR بطاطس ===");
S.recipes.forEach(r => {
  const items = r.items.filter(it => {
    const ing = S.ing.find(g => g.id === it.ingredientId);
    return (ing && (ing.name.includes("بوم فريت") || ing.name.includes("بطاطس"))) || (it.ing && (it.ing.includes("بوم فريت") || it.ing.includes("بطاطس")));
  });
  if (items.length > 0 || r.name.includes("بوم فريت") || r.name.includes("بطاطس") || r.name.includes("فرايز")) {
    console.log("Recipe:", r.code, "|", r.name, "| Items:", items.map(it => {
      const ing = S.ing.find(g => g.id === it.ingredientId);
      return (ing ? ing.name : it.ing) + " (" + it.std + " " + (ing?.unit || "جم") + ")";
    }));
  }
});

console.log("
=== SALES ITEMS LINKED TO FRIES RECIPES OR WITH بوم فريت / بطاطس IN NAME ===");
S.sales.forEach(s => {
  const r = S.recipes.find(rc => rc.id === s.recipeId || rc.code === s.code);
  const hasFries = r && r.items.some(it => {
    const ing = S.ing.find(g => g.id === it.ingredientId);
    return (ing && (ing.name.includes("بوم فريت") || ing.name.includes("بطاطس"))) || (it.ing && (it.ing.includes("بوم فريت") || it.ing.includes("بطاطس")));
  });
  if (hasFries || s.name.includes("بوم فريت") || s.name.includes("بطاطس") || s.name.includes("فرايز")) {
    console.log("Sale:", s.code, "|", s.name, "| Sold Qty:", s.qty, "| Price:", s.price, "| Recipe:", r?.code, r?.name);
  }
});
