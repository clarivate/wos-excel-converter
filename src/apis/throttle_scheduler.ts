import { AxiosResponse } from "axios";

const throttleScheduler = (headerName: string) => {
  let lastResponse: number = Date.UTC(1970, 1);
  return (response: AxiosResponse) => {
    const remainingReqPerSec = Number(response.headers[headerName]);
    const now = Date.now();
    if (remainingReqPerSec < 1) {
      const waitPeriodForThisRequest = now - lastResponse;
      lastResponse = now;
      if (waitPeriodForThisRequest < 1000) {
        return new Promise<AxiosResponse>(resolve => {
          setTimeout(() => resolve(response), waitPeriodForThisRequest + 100);
        });
      }
    }
    lastResponse = now;
    return response;
  };
};
export default throttleScheduler;
