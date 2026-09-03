export const onRequest = async (ctx) => {
  const res = await ctx.next();
  res.headers.set('Cache-Control', 'no-store');
  return res;
};
