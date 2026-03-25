<script lang="ts">
import { page } from "$app/state";
import ProjectDetail from "$lib/components/projects/ProjectDetail.svelte";

const projectId = $derived(page.params.project);
</script>

<ProjectDetail {projectId} />
