import { FC, ReactNode, Suspense } from "react";

import { Skeleton, SkeletonProps } from "@/shared/ui/base";
import ContentReveal from "./ContentReveal";

interface Props {
  children: ReactNode;
  skeletonProps?: SkeletonProps;
}

const SuspenseContent: FC<Props> = ({ skeletonProps, children }) => {
  const loading = (
    <Skeleton
      style={{ padding: 16 }}
      paragraph={{ rows: 3 }}
      loading
      {...skeletonProps}
    />
  );

  return (
    <Suspense fallback={loading}>
      <ContentReveal>{children}</ContentReveal>
    </Suspense>
  );
};

export default SuspenseContent;
