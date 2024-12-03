<script setup>
import { computed } from 'vue';
import { DIRECTIONS } from '../utils/constants';
import { parseNumberFromClueId } from '../utils/helpers';

const emit = defineEmits(['selectClue']);

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  selectedClueId: {
    type: String
  }
});

const CLASSES = {
  BASE: 'crossword-clues'
};

const acrossClues = computed(() => Object.keys(props.data).filter(key => key.includes(DIRECTIONS.ACROSS)));
const downClues = computed(() => Object.keys(props.data).filter(key => key.includes(DIRECTIONS.DOWN)));
</script>

<template>
  <div :class="CLASSES.BASE">
    <section>
      <h2>Across</h2>
      <ul>
        <li v-for="clueId in acrossClues" :key="clueId" :class="{ 'is-selected': clueId === selectedClueId}" @click="emit('selectClue', clueId)">
          <strong>{{ parseNumberFromClueId(clueId) }}</strong>
          <section>
            {{ data[clueId].clue }}
          </section>
        </li>
      </ul>
    </section>
    <section>
      <h2>Down</h2>
      <ul>
        <li v-for="clueId in downClues" :key="clueId" :class="{ 'is-selected': clueId === selectedClueId}" @click="emit('selectClue', clueId)">
          <strong>{{ parseNumberFromClueId(clueId) }}</strong>
          <section>
            {{ data[clueId].clue }}
          </section>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.crossword-clues {
  user-select: none;
  display: flex;
  gap: 1em;
  text-align: left;
}

h2 {
  margin: 0;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 16px;
}

li {
  display: flex;
  justify-content: stretch;
  gap: 2em;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
}

li.is-selected {
  background-color: var(--selected-colour-clues);
}
</style>