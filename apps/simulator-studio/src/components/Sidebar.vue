<template>
  <aside class="w-64 border-r border-slate-800 p-4">
    <h1 class="text-lg font-semibold mb-4">Simulator Studio / Студия Симулятора</h1>
    <nav class="flex flex-col gap-2">
      <RouterLink to="/">Dashboard / Дашборд</RouterLink>
      <RouterLink to="/chats">Chats / Чаты</RouterLink>
      <RouterLink to="/agents">Agents / Агенты</RouterLink>
      <RouterLink to="/knowledge">Knowledge / Знания</RouterLink>
      <RouterLink to="/billing">Billing / Биллинг</RouterLink>
      <RouterLink to="/users">Users / Пользователи</RouterLink>
      <RouterLink to="/account">Account / Аккаунт</RouterLink>
    </nav>
  </aside>
</template>
<script setup lang="ts">
</script>
<style scoped>
a { color:#9db1ff; text-decoration:none }
a.router-link-active { color:#fff; font-weight:600 }
</style>
