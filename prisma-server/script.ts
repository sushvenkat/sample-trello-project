import { prisma } from "./src/lib/prisma";

async function main() {
  // Create a new user with email credsentials
  const user = await prisma.user.create({
    data: {
      password: "Alice123!",
      email: "Alice12345@prisma.io",
      name: "Alice Stephanie",
    },
  });
  console.log("Created user:", user);

  // Fetch all users with their email credsentials
  const allUsers = await prisma.user.findMany({});
  console.log("All users:", JSON.stringify(allUsers, null, 2));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });