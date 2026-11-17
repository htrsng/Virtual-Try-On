package com.vfitai.qa.utils;

import com.google.gson.*;
import java.net.URI;
import java.net.http.*;
import java.time.Duration;

/** Readback/setup against the owned real API. Never logs bearer tokens or accounts. */
public final class ApiClient {
    private final String base;
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    public record Response(int status, JsonElement body) {}
    public ApiClient(QaEnvironment environment) throws Exception { base = environment.data().get("apiURL").getAsString(); }
    public Response request(String method, String path, String token, String json) throws Exception {
        if (!path.startsWith("/api/")) throw new IllegalArgumentException("API path required");
        var builder = HttpRequest.newBuilder(URI.create(base + path)).timeout(Duration.ofSeconds(25)).header("Content-Type", "application/json");
        if (token != null) builder.header("Authorization", "Bearer " + token);
        var result = client.send(builder.method(method, json == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(json)).build(), HttpResponse.BodyHandlers.ofString());
        return new Response(result.statusCode(), JsonParser.parseString(result.body()));
    }
    public String login(JsonObject account) throws Exception {
        var response = request("POST", "/api/auth/login", null, account.toString());
        if (response.status() != 200) throw new IllegalStateException("Fixture login failed: " + response.status());
        return response.body().getAsJsonObject().get("token").getAsString();
    }
    public JsonArray orders(String token) throws Exception {
        var response = request("GET", "/api/orders/my-orders", token, null);
        if (response.status() != 200) throw new IllegalStateException("Order readback failed: " + response.status());
        return response.body().getAsJsonArray();
    }
    public JsonObject order(String token, String id) throws Exception {
        for (var element : orders(token)) if (element.getAsJsonObject().get("_id").getAsString().equals(id)) return element.getAsJsonObject();
        throw new IllegalStateException("Order absent from owner readback");
    }
    public int mediumStock() throws Exception {
        var response = request("GET", "/api/products/50101", null, null);
        if (response.status() != 200) throw new IllegalStateException("Product readback failed");
        for (var variant : response.body().getAsJsonObject().getAsJsonArray("variants"))
            for (var size : variant.getAsJsonObject().getAsJsonArray("sizes"))
                if (size.getAsJsonObject().get("size").getAsString().equals("M")) return size.getAsJsonObject().get("stock").getAsInt();
        throw new IllegalStateException("Seed M size missing");
    }
    public Response addAddress(String token) throws Exception {
        return request("POST", "/api/user/addresses", token, """
            {"fullName":"QA Customer","phone":"0900000000","province":"Hồ Chí Minh","district":"Quận 1","ward":"Bến Nghé","street":"10 QA Street","isDefault":true,"type":"home"}
            """);
    }
}
