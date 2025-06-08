// CreateInvoiceModule.jsx
import { ErpLayout } from '@/layout';
import CreateItem from '@/modules/ErpPanelModule/CreateItem';
import InvoiceForm from '@/modules/InvoiceModule/Forms/InvoiceForm';
import { useSearchParams } from 'react-router-dom';

export default function CreateInvoiceModule({ config }) {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  // ✅ We just pass orderId via props here — form will come from CreateItem
  const InvoiceFormWithOrder = (props) => (
    <InvoiceForm {...props} orderId={orderId} />
  );

  return (
    <ErpLayout>
      <CreateItem config={config} CreateForm={InvoiceFormWithOrder} />
    </ErpLayout>
  );
}
