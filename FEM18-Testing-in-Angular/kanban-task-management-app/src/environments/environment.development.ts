// Development build (`ng serve`): angular.json swaps this in for environment.ts.
// Same MockAPI project as production; point it at a separate project to keep dev data apart.
export const environment = {
  apiUrl: 'https://6a783bdcf0f1cdf392243b73.mockapi.io/api/v1',
  authToken: 'kanban-demo-token',
};
