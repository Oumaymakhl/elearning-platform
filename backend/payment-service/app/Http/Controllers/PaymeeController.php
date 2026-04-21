<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Payment;
use Stripe\Stripe;
use Stripe\Checkout\Session;

class PaymeeController extends Controller
{
    public function __construct()
    {
        Stripe::setApiKey(env("STRIPE_SECRET_KEY"));
    }

    public function initiate(Request $request)
    {
        $request->validate([
            "user_id"   => "required|integer",
            "course_id" => "required|integer",
            "amount"    => "required|numeric|min:1",
            "email"     => "required|email",
        ]);

        $payment = Payment::create([
            "user_id"   => $request->user_id,
            "course_id" => $request->course_id,
            "amount"    => $request->amount,
            "status"    => "pending",
        ]);

        $session = Session::create([
            "payment_method_types" => ["card"],
            "customer_email"       => $request->email,
            "line_items" => [[
                "price_data" => [
                    "currency"     => "usd",
                    "product_data" => ["name" => "Cours ID " . $request->course_id],
                    "unit_amount"  => $request->amount * 100,
                ],
                "quantity" => 1,
            ]],
            "mode"        => "payment",
            "success_url" => "http://localhost:4200/payment/success?session_id={CHECKOUT_SESSION_ID}",
            "cancel_url"  => "http://localhost:8010/api/payments/cancel",
            "metadata"    => ["payment_id" => $payment->id],
        ]);

        $payment->update(["paymee_token" => $session->id]);

        return response()->json([
            "success"     => true,
            "payment_id"  => $payment->id,
            "payment_url" => $session->url,
        ]);
    }

    public function webhook(Request $request)
    {
        return response()->json(["success" => true]);
    }

    public function success(Request $request)
    {
        $payment = Payment::where("paymee_token", $request->session_id)->first();
        if ($payment) {
            $payment->update(["status" => "paid"]);
        }
        return response()->json(["success" => true, "message" => "Paiement réussi"]);
    }

    public function cancel(Request $request)
    {
        return response()->json(["success" => false, "message" => "Paiement annulé"]);
    }

    public function index(Request $request)
    {
        $payments = Payment::where("user_id", $request->user_id)->get();
        return response()->json(["success" => true, "data" => $payments]);
    }
}
