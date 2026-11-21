<script setup lang="ts">
import { kinds } from "../../../src";

/** Every kind that has options, with each option's values: generated from the kinds themselves. */
const exportName = (id: string) => id.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());
const rows = kinds
  .filter(kind => Object.keys(kind.options).length > 0)
  .flatMap(kind =>
    Object.entries(kind.options).map(([option, values], k) => ({
      kind: k === 0 ? exportName(kind.id) : "",
      option,
      values: values.map(v => JSON.stringify(v)).join(", "),
    })),
  );
</script>

<template>
  <table>
    <thead>
      <tr>
        <th>Kind</th>
        <th>Option</th>
        <th>Values</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in rows" :key="row.kind + row.option">
        <td>
          <code v-if="row.kind">{{ row.kind }}</code>
        </td>
        <td>
          <code>{{ row.option }}</code>
        </td>
        <td>
          <code>{{ row.values }}</code>
        </td>
      </tr>
    </tbody>
  </table>
</template>
