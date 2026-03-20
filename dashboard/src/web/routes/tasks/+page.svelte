<script lang="ts">
import TasksList from "$lib/components/tasks/TasksList.svelte";
</script>

<h1 class="page-title">Tasks</h1>
<TasksList />

<style>
	.page-title {
		font-size: 20px;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 20px;
	}
</style>
