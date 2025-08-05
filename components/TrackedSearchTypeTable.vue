<template>
    <v-data-table
        :items="rows"
        class="elevation-1"
        :headers="props.headers"
    >

        <!-- Status chip -->
        <template #item.status="{ item }">
            <v-chip v-if="!item.fullName && !item.followers && !item.following && !item.totalPosts" 
                    size="small" 
                    color="grey">
                ⏳ Collecting…
            </v-chip>
            <span v-else>Parsed</span>
        </template>

        <!-- Remove btn -->
        <template #item.actions="{ item }">
            <v-btn
                size="small"
                variant="text"
                color="error"
            >
                Remove
            </v-btn>
        </template>
    </v-data-table>

    <!-- подтверждение -->
    <!-- <ConfirmDialog
        v-model="dlg"
        :text="`Stop tracking ${toRemove}?\\nAre you sure?`"
        @confirm="doRemove"
    /> -->
</template>


<script setup lang="ts">
    import ConfirmDialog from './ConfirmDialog.vue'

    const props = defineProps<{
        searchType: any[]
        headers: any[]
    }>()

    const rows = computed(() => props.searchType)
</script>