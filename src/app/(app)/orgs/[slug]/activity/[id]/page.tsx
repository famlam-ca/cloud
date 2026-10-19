import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api/server"
import { parseActivityMetadata } from "@/schemas/activity"

export default async function Page({
  params,
}: PageProps<"/orgs/[slug]/activity/[id]">) {
  const { id } = await params

  const activity = await api.activity.get({ id })

  const metadata = parseActivityMetadata(activity.type, activity.metadata)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <p>
            <strong>Type:</strong> {activity.type}
          </p>
          <p>
            <strong>Organization ID:</strong> {activity.organizationId}
          </p>
          <p>
            <strong>Timestamp:</strong>{" "}
            {new Date(activity.timestamp).toLocaleString()}
          </p>
          <p>
            <strong>Metadata:</strong>{" "}
            <pre>{JSON.stringify(metadata, null, 2)}</pre>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
