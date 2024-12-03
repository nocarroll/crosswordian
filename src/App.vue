<script setup>
import { ref, computed, nextTick } from 'vue';
import * as data from './data';

const CLASSES = {
  CROSSWORD_GRID: 'crossword-grid',
  ROW: 'row',
  CELL: 'cell',
  CHAR: 'char',
  ANSWER: 'answer'
};

const DIRECTIONS = {
  ACROSS: 'a',
  DOWN: 'd',
};

const isRevealedGlobal = ref(false);
const revealedClues = ref([]);
const selectedParent = ref(null);
const selectedAddress = ref(null);
const grid = ref(createGrid(13));
const clues = ref(data.clues);

const gridLookup = computed(() => {
  return grid.value.reduce((acc, row) => {
    row.forEach((address) => {
      const { char, label, hyphen, wordBreak, parents } = getAddressProperties(address);
      acc[address] = {
        char,
        label,
        parents,
        hyphen,
        wordBreak,
        isSelected: isAddressSelected(parents),
        isRevealed: isAddressRevealed(parents),
      };
    });
    return acc;
  }, {});
});

const answerLookup = ref({});

function createGrid(size) {
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => `${row}.${col}`)
  );
}

function getAddressProperties(address) {
  let char = '';
  let label = '';
  let hyphen = '';
  let wordBreak = '';
  const parents = {};
  for (const [key, clue] of Object.entries(clues.value)) {
    clue.fullAddress.forEach((clueAddress, i) => {
      if (clueAddress === address) char = clue.answer[i];
      if (clue.startAddress === address) label = key.match(/^\d+/)[0];
      const direction = key.match(/[a-zA-Z]$/)[0];
      if (clue.hyphens.includes(address)) hyphen = direction;
      if (clue.wordBreaks.includes(address)) wordBreak = direction;
      if (clue.fullAddress.includes(address)) {
        parents[direction] = key;
      }
    });
  }
  return { char, label, hyphen, wordBreak, parents };
}

function isAddressSelected(parents) {
  return Object.values(parents).includes(selectedParent.value);
}

function isAddressRevealed(parents) {
  return revealedClues.value.some(parent => Object.values(parents).includes(parent));
}

function onInput({ target }) {
  // Store the value from the input
  answerLookup.value[selectedAddress.value] = target.value.toUpperCase();
  // Move to the next letter
  goToNextAddress();
}

function goToNextAddress() {
  const currentAddress = selectedAddress.value;
  const direction = selectedParent.value.match(/[a-zA-Z]$/)[0];
  const [x, y] = getNumericAddressFromStringAddress(currentAddress);
  const nextAddress = direction === DIRECTIONS.ACROSS ? `${x}.${y + 1}` : `${x + 1}.${y}`;
  
  // Check if the next address is valid, if not we stop inputting
  if (gridLookup.value[nextAddress] && gridLookup.value[nextAddress].char !== '') {
    setSelectedAddress(nextAddress);
  } else {
    setSelectedAddress(null);
  }

}

function getNumericAddressFromStringAddress(stringAddress) {
  return stringAddress.split('.').map(part => parseInt(part));
}

function onSelect(address) {
  setSelectedAddress(address);
  setSelectedParent(gridLookup.value[address]);
}

function setSelectedAddress(address) {
  selectedAddress.value = address;
  if (!address) return;
  nextTick(() => {
    // TODO: update to use a ref instead of id
    document.getElementById(`input-${address}`).focus();
  });
}

function setSelectedParent(gridLookupItem) {
  const parents = gridLookupItem.parents;
  const values = Object.values(parents);
  let nextParentIndex = 0;
  if (values.length > 1 && values.includes(selectedParent.value)) {
    // Switch between parents of the selected address
    let currentParentIndex = values.indexOf(selectedParent.value);
    nextParentIndex = currentParentIndex === 0 ? 1 : 0;
  }
  selectedParent.value = values[nextParentIndex];
}

function checkSelected() {
  if (!selectedParent.value) return;
  const clue = clues.value[selectedParent.value];
  if (!clue) throw new Error(`No clue found for ${selectedParent.value}`);
  clue.fullAddress.forEach(address => {
    if (!answerLookup.value[address] || answerLookup.value[address] !== gridLookup.value[address].char) {
      answerLookup.value[address] = undefined;
    }
  });
}

function revealSelected() {
  if (!selectedParent.value || revealedClues.value.includes(selectedParent.value)) return;
  revealedClues.value.push(selectedParent.value);
}

function revealAll() {
  isRevealedGlobal.value = true;
}

function clearSelected() {
  if (!selectedParent.value) return;
  // First clear the revealed clues
  revealedClues.value = revealedClues.value.filter(parent => parent !== selectedParent.value);
  // Then clear the user's answer
  const clue = clues.value[selectedParent.value];
  if (!clue) throw new Error(`No clue found for ${selectedParent.value}`);
  clue.fullAddress.forEach(address => {
    answerLookup.value[address] = undefined;
  });
}

function clearAll() {
  isRevealedGlobal.value = false;
  revealedClues.value = [];
  selectedParent.value = null;
  answerLookup.value = {};
}
</script>

<template>
  <main>
    <pre v-if="false">
      {{ JSON.stringify(gridLookup, null, 2) }}
    </pre>
    <br />
    <header>
      <button type="button" :disabled="!selectedParent" @click="checkSelected">Check This</button>
      <button type="button" :disabled="!selectedParent" @click="revealSelected">Reveal This</button>
      <button type="button" :disabled="!selectedParent" @click="clearSelected">Clear This</button>
    </header>
    <header>
      <span> <strong>Selected:</strong> {{ selectedParent }} </span>
      
      <button type="button" @click="revealAll">Reveal All</button>
      <button type="button" @click="clearAll">
        Clear All
      </button>
    </header>
    <div :class="CLASSES.GRID">
      <div v-for="(row, i) in grid" :key="`row-${i}`" :class="CLASSES.ROW">
        <div v-for="address in row" :key="`address-${address}`" :class="[
          CLASSES.CELL,
          {
            'is-empty': !gridLookup[address].char,
            'is-selected': gridLookup[address].isSelected,
            'has-vertical-hyphen':
              gridLookup[address].hyphen === DIRECTIONS.DOWN,
            'has-horizontal-hyphen':
              gridLookup[address].hyphen === DIRECTIONS.ACROSS,
            'has-vertical-word-break':
              gridLookup[address].wordBreak === DIRECTIONS.DOWN,
            'has-horizontal-word-break':
              gridLookup[address].wordBreak === DIRECTIONS.ACROSS,
          },
        ]" @click="onSelect(address)">
          <small v-if="gridLookup[address].label">{{
            gridLookup[address].label
            }}</small>
          <span v-if="answerLookup[address]" :class="CLASSES.ANSWER">
            {{ answerLookup[address] }}
          </span>
          <span v-else-if="isRevealedGlobal || gridLookup[address].isRevealed" :class="CLASSES.CHAR">
            {{ gridLookup[address].char }}
          </span>
          <input
            v-if="address === selectedAddress"
            :id="`input-${address}`"
            type="text"
            tabindex="-1"
            maxlength="1"
            autocomplete="off"
            spellcheck="false"
            autocorrect="off"
            @input="onInput"
          />
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
header {
  padding: 0.5em 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}

header>span {
  margin-right: auto;
}

.row {
  display: flex;
  flex-direction: row;
  width: fit-content;
  border-bottom: 1px solid var(--grid-colour);
}

.row:first-child {
  border-top: 1px solid var(--grid-colour);
}

.cell {
  cursor: pointer;
  box-sizing: border-box;
  user-select: none;
  position: relative;
  font-size: 20px;
  width: 38px;
  height: 38px;
  border-left: 1px solid var(--grid-colour);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cell:hover {
  background-color: #eee;
}

.cell:last-child {
  border-right: 1px solid var(--grid-colour);
}

.cell.is-empty {
  pointer-events: none;
  background-color: var(--grid-colour);
}

.cell.is-selected {
  background-color: var(--selected-colour);
}

.cell.has-horizontal-word-break:before {
  content: '';
  width: 3px;
  height: 100%;
  background-color: var(--grid-colour);
  position: absolute;
  right: -2px;
  z-index: 1;
}

.cell.has-vertical-word-break:before {
  content: '';
  width: 100%;
  height: 3px;
  background-color: var(--grid-colour);
  position: absolute;
  bottom: -2px;
  z-index: 1;
}

.cell.has-horizontal-hyphen::after {
  content: '';
  width: 11px;
  height: 1px;
  background-color: var(--grid-colour);
  position: absolute;
  right: -6px;
  z-index: 1;
}

.cell.has-vertical-hyphen::after {
  content: '';
  width: 1px;
  height: 10px;
  background-color: var(--grid-colour);
  position: absolute;
  bottom: -6px;
  z-index: 1;
}

.cell>small {
  font-size: 9px;
  position: absolute;
  top: 1px;
  left: 2px;
}

.cell>input {
  position: absolute;
  border: none;
  padding: 0;
  width: 100%;
  height: 100%;
  text-align: center;
  background-color: rgba(0, 0, 0, 0);
  font-size: 20px;
  font-weight: 800;
  text-anchor: middle;
  text-transform: uppercase;
}
</style>
