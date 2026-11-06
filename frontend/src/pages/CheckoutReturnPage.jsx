import { useEffect } from "react";
import { Link, Navigate, useSearchParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRightIcon, CircleCheckIcon, PackageIcon } from "lucide-react";
import { useCart } from "../store/cart";

// Polar redirects here after a successful payment:
// `${FRONTEND_URL}/checkout/return?checkout_id=...`
function CheckoutReturnPage() {
    const [params] = useSearchParams();
    const checkoutId = params.get("checkout_id");
    const clearCart = useCart((s) => s.clear);
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!checkoutId) return;
        // payment went through, so the local cart is no longer needed
        clearCart();
        // the order is created by the Polar webhook; make sure the orders list refetches
        queryClient.invalidateQueries({ queryKey: ["orders"] });
    }, [checkoutId, clearCart, queryClient]);

    if (!checkoutId) return <Navigate to="/cart" replace />;

    return (
        <div className="mx-auto max-w-lg rounded-2xl border border-base-300 bg-base-100 px-6 py-12 text-center shadow-sm sm:px-10 sm:py-16">
            <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-primary/15 text-primary ring-4 ring-base-200/80">
                <CircleCheckIcon className="size-10" aria-hidden />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-base-content sm:text-2xl">
                Payment successful
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-base-content/65">
                Thanks for your order! It may take a few seconds to appear in your orders while we
                confirm the payment.
            </p>
            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
                <Link to="/orders" className="btn btn-primary gap-2 shadow-md">
                    <PackageIcon className="size-4" aria-hidden />
                    View orders
                </Link>
                <Link to="/" className="btn btn-ghost gap-2 border border-base-300">
                    Keep shopping
                    <ArrowRightIcon className="size-4" aria-hidden />
                </Link>
            </div>
        </div>
    );
}

export default CheckoutReturnPage;
