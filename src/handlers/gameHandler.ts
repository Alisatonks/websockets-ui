export const gameHandler = (data: string) => {
  const ships = JSON.parse(data);
  console.log('ships', ships);
};
