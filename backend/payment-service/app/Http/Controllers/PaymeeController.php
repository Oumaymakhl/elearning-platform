<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Payment;
use Stripe\Stripe;
use Stripe\Checkout\Session;
use Illuminate\Support\Facades\Http;

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
            "success_url" => rtrim(env('FRONTEND_URL', 'http://52.2.181.255:8080'), '/') . "/payment/success?session_id={CHECKOUT_SESSION_ID}&course_id=" . $request->course_id,
            "cancel_url"  => rtrim(env('FRONTEND_URL', 'http://52.2.181.255:8080'), '/') . "/courses/" . $request->course_id,
            "metadata"    => ["payment_id" => (string) $payment->id],
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
        $request->validate(['session_id' => 'required|string']);
        $payment = Payment::where("paymee_token", $request->session_id)->firstOrFail();
        $session = Session::retrieve($request->session_id);
        if ($session->payment_status !== 'paid' || (int) ($session->metadata->payment_id ?? 0) !== (int) $payment->id) {
            return response()->json(['success' => false, 'message' => 'Paiement non confirmé'], 402);
        }

        $enrollment = Http::timeout(10)->post('http://nginx-course/api/internal/enroll', [
            'user_id' => $payment->user_id,
            'course_id' => $payment->course_id,
        ]);
        if (!$enrollment->successful()) {
            return response()->json(['success' => false, 'message' => 'Paiement confirmé, inscription en attente'], 502);
        }

        $payment->update(['status' => 'paid', 'transaction_id' => $session->payment_intent]);
        return response()->json([
            'success' => true,
            'message' => 'Paiement réussi. Vous êtes inscrit au cours.',
            'course_id' => $payment->course_id,
            'enrolled' => true,
        ]);
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

    public function destroyForCourse($courseId)
    {
        $deleted = Payment::where('course_id', $courseId)->delete();
        return response()->json(['deleted' => $deleted]);
    }
}
