import { json, LoaderFunctionArgs, type MetaFunction } from "@remix-run/node";
import {Helper} from "../components/helper";
import { useLoaderData } from "@remix-run/react";
import { AppService } from "~/helper-backend";
import { ChakraProvider } from '@chakra-ui/react'

export const meta: MetaFunction = () => {
  return [
    { title: "Coev Webdev Studio" },
    { name: "description", content: "Coev Webdev Studio" },
  ];
};
// Big stupid fucking catch - this MUST be in a route - cannot be in component


export default function Index() {
  return (
    <ChakraProvider>

    <div className="font-sans">
      <Helper />
    </div>
    </ChakraProvider>
  );
}


