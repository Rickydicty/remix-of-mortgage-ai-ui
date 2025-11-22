import { useParams } from "react-router-dom";
import AIPManagementTab from "@/components/broker/AIPManagementTab";

const BrokerAIPPage = () => {
  const { applicationId } = useParams<{ applicationId: string }>();

  if (!applicationId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No application selected</p>
        <p className="text-sm text-muted-foreground mt-2">
          Please select an application from the tracker to view AIP management
        </p>
      </div>
    );
  }

  return <AIPManagementTab applicationId={applicationId} />;
};

export default BrokerAIPPage;
