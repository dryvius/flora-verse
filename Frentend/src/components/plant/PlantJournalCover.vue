<script setup lang="ts">
import SpecimenCard from '@/components/plant/SpecimenCard.vue'
import type { PlantRarity } from '@/enums/plant-rarity'

interface Props {
  itemId: string
  title: string
  latinName: string
  imageUrl: string
  family?: string
  capturedAt?: string
  count?: number
  isNew?: boolean
  compact?: boolean
  note?: string
  rarity?: PlantRarity
  tags?: string[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  tap: [itemId: string]
}>()

function handleTap(itemId: string): void {
  emit('tap', itemId)
}
</script>

<template>
  <SpecimenCard
    :item-id="props.itemId"
    :title="props.title"
    :latin-name="props.latinName"
    :image-url="props.imageUrl"
    :family="props.family"
    :captured-at="props.capturedAt"
    :count="props.count"
    :is-new="props.isNew"
    :compact="props.compact"
    :note="props.note"
    :rarity="props.rarity"
    :tags="props.tags"
    layout="tile"
    @tap="handleTap"
  />
</template>
