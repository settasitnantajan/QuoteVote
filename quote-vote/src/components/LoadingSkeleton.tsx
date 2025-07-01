import { Loader2 } from 'lucide-react';

export const LoadingSkeleton = () => {
  return (
    <div className="relative w-full h-full">
      {/* Semi-transparent blurred overlay */}
      <div className="absolute inset-0 bg-black opacity-50 backdrop-blur-sm z-10"></div>

      {/* Centered loading spinner */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>

      {/* Content that will be "covered" by the loading effect (optional) */}
      {/* You can add a placeholder or a blurred version of your content here */}
      {/* For example:
      <div className="opacity-50 blur-sm">
        <p>Loading...</p> 
      </div>
      */}

      {/* Note: The actual content that will be displayed after loading should NOT be placed inside this skeleton component.  */}
    </div>
  );
};

