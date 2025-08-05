<template>
    <v-data-table
        :items="rows"
        :loading="store.loading"
        :headers="[
            {title:'Hashtag',     value:'tag'},
            {title:'First Seen',  value:'firstSeen'},
            {title:'Total Posts', value:'totalPosts'},
            {title:'Status',      value:'status'}
        ]"
    >

        <!-- формат даты -->
        <template #item.firstSeen="{item}">
            {{ item.firstSeen ? new Date(item.firstSeen).toLocaleString() : '—' }}
        </template>

        <!-- статус вычисляем на лету -->
        <template #item.status="{item}">
            <v-chip v-if="!item.firstSeen && !item.totalPosts" size="small" color="grey">
                ⏳ Collecting…
            </v-chip>
            <v-chip v-else size="small" color="green">
                Parsed
            </v-chip>
        </template>
    </v-data-table>
</template>

<script setup lang="ts">
    import { computed } from 'vue'
    import { useHashtagsStore } from '@/stores/hashtags'
    const store = useHashtagsStore()
    const rows  = computed(() => store.list)
</script>