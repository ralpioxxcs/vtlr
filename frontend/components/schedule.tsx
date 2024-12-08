interface ScheduleData {
  title: string;
  description: string;
  type: string;
  interval: string;
  active: boolean;
  createdAt: string;
}

export default function ScheduleCard({
  title,
  description,
  type,
  interval,
  active,
  createdAt,
}: ScheduleData) {
  return (
    <div className="max-w-md mx-auto bg-white shadow-md rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4">
        {/* Title */}
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>

        {/* Description */}
        <p className="text-gray-600 mt-2">{description}</p>

        {/* Details */}
        <div className="mt-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Type:</span>
            <span className="text-sm font-medium text-gray-700">
              {type === "recurring" ? "루틴" : "이벤트"}
            </span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-500">Interval:</span>
            <span className="text-sm font-medium text-gray-700">
              {interval}
            </span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-500">Status:</span>
            <span
              className={`text-sm font-medium ${
                active ? "text-green-600" : "text-red-600"
              }`}
            >
              {active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          Created at: {new Date(createdAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
