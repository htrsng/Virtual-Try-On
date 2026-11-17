package com.vfitai.qa.pages;
import org.openqa.selenium.*;

public final class CheckoutPage extends BasePage {
    public CheckoutPage(WebDriver driver) { super(driver); }
    public String selectedProduct() {
        click(d -> d.findElements(By.cssSelector(".co-summary button")).stream().filter(e -> e.getText().contains("(1)")).findFirst().orElse(null));
        return visible(By.cssSelector(".co-mini-product")).getText();
    }
    public int selectedCount() { return driver.findElements(By.cssSelector(".co-mini-product")).size(); }
}
