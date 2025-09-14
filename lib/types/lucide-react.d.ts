// Type declarations for lucide-react compatibility
declare module "lucide-react" {
  import { FC, SVGProps } from "react";

  export interface LucideProps extends SVGProps<SVGSVGElement> {
    size?: string | number;
    strokeWidth?: string | number;
  }

  export const AlertCircle: FC<LucideProps>;
  export const AlertTriangle: FC<LucideProps>;
  export const CheckCircle: FC<LucideProps>;
  export const Clock: FC<LucideProps>;
  export const Copy: FC<LucideProps>;
  export const Download: FC<LucideProps>;
  export const ExternalLink: FC<LucideProps>;
  export const Home: FC<LucideProps>;
  export const Loader2: FC<LucideProps>;
  export const Smartphone: FC<LucideProps>;
  export const XCircle: FC<LucideProps>;
}
