<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Stripe\Stripe;
use Stripe\Checkout\Session;
use Illuminate\Support\Facades\Http;
use App\Models\Payment;

class StripeController extends Controller
{
    public function initiate(Request $request)
    {
        $userId   = $request->user_id;
        $courseId = $request->course_id;
        $amount   = floatval($request->amount);

        // Cours gratuit → inscription directe
        if ($amount <= 0) {
            Http::post('http://nginx-course/api/courses/' . $courseId . '/enroll', [
                'user_id' => $userId
            ]);
            return response()->json(['success' => true, 'free' => true]);
        }

        Stripe::setApiKey(env('STRIPE_SECRET_KEY'));

        // Créer le paiement en base
        $payment = Payment::create([
            'user_id'   => $userId,
            'course_id' => $courseId,
            'amount'    => $amount,
            'status'    => 'pending',
        ]);

        $session = Session::create([
            'payment_method_types' => ['card'],
            'customer_email'       => $request->email,
            'line_items' => [[
                'price_data' => [
                    'currency'     => 'usd',
                    'product_data' => ['name' => 'Cours #' . $courseId],
                    'unit_amount'  => intval($amount * 100),
                ],
                'quantity' => 1,
            ]],
            'mode'        => 'payment',
            'success_url' => 'http://localhost:4200/payment/success?session_id={CHECKOUT_SESSION_ID}&course_id=' . $courseId . '&user_id=' . $userId,
            'cancel_url'  => 'http://localhost:4200/courses/' . $courseId . '?payment_cancelled=1',
            'metadata'    => ['payment_id' => $payment->id, 'user_id' => $userId, 'course_id' => $courseId],
        ]);

        // Sauvegarder session_id Stripe
        $payment->update(['paymee_token' => $session->id]);

        return response()->json([
            'success'     => true,
            'payment_id'  => $payment->id,
            'payment_url' => $session->url,
        ]);
    }

    public function success(Request $request)
    {
        Stripe::setApiKey(env('STRIPE_SECRET_KEY'));

        $sessionId = $request->session_id;
        $session   = Session::retrieve($sessionId);

        if ($session->payment_status === 'paid') {
            // Mettre à jour le paiement en base
            $payment = Payment::where('paymee_token', $sessionId)->first();
            if ($payment && $payment->status !== 'paid') {
                $payment->update(['status' => 'paid']);

                // Inscrire l'utilisateur au cours
                Http::post('http://nginx-course/api/courses/' . $payment->course_id . '/enroll', [
                    'user_id' => $payment->user_id
                ]);
            }
            return response()->json(['success' => true, 'message' => 'Paiement confirmé et inscription effectuée']);
        }

        return response()->json(['success' => false, 'message' => 'Paiement non confirmé'], 400);
    }
}
