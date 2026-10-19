import { randomUUID } from "node:crypto"

import { env } from "@/env"
import { db } from "@/server/db"
import {
  networkTable,
  operatingSystemCategoryTable,
  operatingSystemReleaseTable,
  operatingSystemTable,
  resourcePlanTable,
} from "@/server/db/schema"

async function main() {
  console.info("Seeding database...")

  const [linuxCategory, windowsCategory] = await Promise.all([
    db
      .insert(operatingSystemCategoryTable)
      .values({
        id: randomUUID(),
        name: "linux",
      })
      .onConflictDoUpdate({
        set: { updatedAt: new Date() },
        target: operatingSystemCategoryTable.name,
      })
      .returning(),
    db
      .insert(operatingSystemCategoryTable)
      .values({
        id: randomUUID(),
        name: "windows",
      })
      .onConflictDoUpdate({
        set: { updatedAt: new Date() },
        target: operatingSystemCategoryTable.name,
      })
      .returning(),
  ])

  const categories = [linuxCategory[0], windowsCategory[0]]

  const releases = await db
    .insert(operatingSystemReleaseTable)
    .values([
      {
        categoryId: categories[0].id,
        codename: "noble numbat",
        family: "ubuntu",
        id: randomUUID(),
        isLts: true,
        version: "24.04",
      },
      {
        categoryId: categories[0].id,
        codename: "resolute raccoon",
        family: "ubuntu",
        id: randomUUID(),
        isLts: true,
        version: "26.04",
      },
      {
        categoryId: categories[0].id,
        codename: "bookworm",
        family: "debian",
        id: randomUUID(),
        isLts: true,
        version: "12",
      },
      {
        categoryId: categories[1].id,
        codename: "windows server 2022",
        family: "windows server",
        id: randomUUID(),
        isLts: false,
        version: "2022",
      },
      {
        categoryId: categories[0].id,
        codename: "centos 7",
        family: "centos",
        id: randomUUID(),
        isLts: false,
        version: "7",
      },
      {
        categoryId: categories[0].id,
        codename: "fedora 44",
        family: "fedora",
        id: randomUUID(),
        isLts: false,
        version: "44",
      },
    ])
    .onConflictDoUpdate({
      set: { updatedAt: new Date() },
      target: [
        operatingSystemReleaseTable.family,
        operatingSystemReleaseTable.version,
      ],
    })
    .returning()

  function findReleaseId(family: string, version: string) {
    const matched = releases.find(
      (r) => r.family === family && r.version === version,
    )
    if (!matched)
      throw new Error(
        `Could not find seeded release id for ${family} ${version}`,
      )
    return matched.id
  }

  await db
    .insert(operatingSystemTable)
    .values([
      {
        cloudInitEnabled: true,
        id: randomUUID(),
        name: "Ubuntu 24.04 LTS",
        pveVmid: 9001,
        releaseId: findReleaseId("ubuntu", "24.04"),
        slug: "ubuntu-24.04-lts",
        status: "active",
      },
      {
        cloudInitEnabled: true,
        id: randomUUID(),
        name: "Ubuntu 26.04 LTS",
        pveVmid: 9000,
        releaseId: findReleaseId("ubuntu", "26.04"),
        slug: "ubuntu-26.04-lts",
        status: "active",
      },
      {
        cloudInitEnabled: true,
        id: randomUUID(),
        name: "Debian 12",
        pveVmid: 9100,
        releaseId: findReleaseId("debian", "12"),
        slug: "debian-12",
        status: "active",
      },
      {
        cloudInitEnabled: true,
        id: randomUUID(),
        name: "Windows Server 2022",
        pveVmid: 9200,
        releaseId: findReleaseId("windows server", "2022"),
        slug: "windows-server-2022",
        status: "inactive",
      },
      {
        cloudInitEnabled: true,
        id: randomUUID(),
        name: "CentOS 7",
        pveVmid: 9300,
        releaseId: findReleaseId("centos", "7"),
        slug: "centos-7",
        status: "inactive",
      },
      {
        cloudInitEnabled: true,
        id: randomUUID(),
        name: "Fedora 44",
        pveVmid: 9400,
        releaseId: findReleaseId("fedora", "44"),
        slug: "fedora-44",
        status: "inactive",
      },
    ])
    .onConflictDoUpdate({
      set: { updatedAt: new Date() },
      target: operatingSystemTable.pveVmid,
    })

  await db
    .insert(resourcePlanTable)
    .values([
      {
        cores: 1,
        description:
          "Lightweight services, development environments, and simple utilities.",
        disk: 10,
        id: randomUUID(),
        memory: 512,
        name: "Micro",
        slug: "micro",
        status: "active",
      },
      {
        cores: 2,
        description:
          "Small applications, personal projects, and development workloads.",
        disk: 20,
        id: randomUUID(),
        memory: 1024,
        name: "Small",
        slug: "small",
        status: "active",
      },
      {
        cores: 4,
        description:
          "General-purpose applications, APIs, and small production services.",
        disk: 40,
        id: randomUUID(),
        memory: 2048,
        name: "Medium",
        slug: "medium",
        status: "active",
      },
      {
        cores: 8,
        description:
          "Production workloads, databases, and applications with higher resource demands.",
        disk: 80,
        id: randomUUID(),
        memory: 4096,
        name: "Large",
        slug: "large",
        status: "active",
      },
      {
        cores: 16,
        description:
          "High-performance applications, larger databases, and compute-intensive workloads.",
        disk: 160,
        id: randomUUID(),
        memory: 8192,
        name: "X-Large",
        slug: "x-large",
        status: "inactive",
      },
      {
        cores: 32,
        description:
          "Heavy production workloads, large databases, and demanding compute applications.",
        disk: 320,
        id: randomUUID(),
        memory: 16384,
        name: "2X Large",
        slug: "2x-large",
        status: "inactive",
      },
    ])
    .onConflictDoUpdate({
      set: { updatedAt: new Date() },
      target: resourcePlanTable.slug,
    })

  await db
    .insert(networkTable)
    .values({
      cidr: 24,
      dhcpEnabled: true,
      dnsServers: ["192.168.80.254"],
      gateway: "192.168.80.254",
      id: randomUUID(),
      name: "HHN Cloud Private",
      network: "192.168.80.0/24",
      vlanId: Number(env.OPNSENSE_CLOUD_NETWORK_VLAN_ID),
    })
    .onConflictDoUpdate({
      set: { updatedAt: new Date() },
      target: networkTable.vlanId,
    })
}

main()
  .then(() => {
    console.info("Database seeded successfully.")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Failed to seed database:", error)
    process.exit(1)
  })
